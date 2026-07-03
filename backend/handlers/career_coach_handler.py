"""
Career Coach handler — 5-step AI coaching pipeline.

Routes:
  POST /career/coach/profile           Step 1: Profile target position
  POST /career/coach/assess            Step 2: Assess current state
  POST /career/coach/paths             Step 3+4: Gap analysis + path generation
  POST /career/coach/paths/{pathId}/select  Step 4b: Activate a path (cross-module)
  POST /career/coach/coaching/{targetId}    Step 5: Continuous coaching cycle
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime

import boto3

from prompts.career_coach import CAREER_COACH_SYSTEM_PROMPT
from repositories import get_repository
from utils.cost_guard import BedrockCostGuard
from utils.response import error, ok

_BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-20250514")
_bedrock = boto3.client("bedrock-runtime", region_name=_BEDROCK_REGION)
_cost_guard = BedrockCostGuard()

_target_repo = get_repository("TARGET")
_path_repo = get_repository("CPATH")
_coach_repo = get_repository("COACH")
_skill_repo = get_repository("SKILL")
_achieve_repo = get_repository("ACHIEVE")
_cert_repo = get_repository("CERT")
_lgoal_repo = get_repository("LGOAL")
_task_repo = get_repository("TASK")
_event_repo = get_repository("EVENT")


def handler(event, context):
    user_id = _extract_user_id(event)
    if not user_id:
        return error("Unauthorized", 401)

    if not _cost_guard.within_budget(user_id):
        return error("Monthly AI budget exceeded.", 429)

    path = event.get("rawPath", "")
    method = event["requestContext"]["http"]["method"]
    path_params = event.get("pathParameters") or {}
    body = json.loads(event.get("body") or "{}")

    if method == "POST" and path.endswith("/profile"):
        return _profile_target(user_id, body)

    if method == "POST" and path.endswith("/assess"):
        return _assess_state(user_id, body)

    if method == "POST" and "/paths" in path and path.endswith("/select"):
        path_id = path_params.get("pathId")
        return _activate_path(user_id, path_id, body)

    if method == "POST" and path.endswith("/paths"):
        return _generate_paths(user_id, body)

    if method == "POST" and "/coaching/" in path:
        target_id = path_params.get("targetId")
        return _run_coaching(user_id, target_id)

    return error("Unknown route", 404)


# ---------------------------------------------------------------------------
# Step 1: Profile target position
# ---------------------------------------------------------------------------

def _profile_target(user_id: str, body: dict) -> dict:
    title = body.get("title", "")
    context_note = body.get("context", "")

    prompt = f"""사용자가 "{title}" 포지션을 목표로 설정했습니다.
{"추가 맥락: " + context_note if context_note else ""}

이 포지션의 요구 조건을 다음 6가지 차원으로 분석해주세요:
1. 핵심 기술 역량 (must/preferred/nice_to_have)
2. 소프트 스킬
3. 교육/자격 요건
4. 경험/포트폴리오 요건
5. 네트워크/커뮤니티 기대치
6. 시장 현황 (수요, 연봉, 경쟁)

JSON 포맷으로 응답하세요. 필드: coreSkills, softSkills, education, experience, network, marketData"""

    raw, usage = _call_bedrock(prompt)
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])
    profile = _parse_json(raw)

    target = _target_repo.put(user_id, {
        "title": title,
        "description": context_note,
        "status": "exploring",
        "profile": profile,
        "currentAssessment": [],
        "alternativePaths": [],
        "overallReadiness": 0,
        "estimatedMonths": 0,
        "lastAssessedAt": datetime.utcnow().isoformat(),
        "sort_key": "exploring",
    })
    return ok(target, 201)


# ---------------------------------------------------------------------------
# Step 2+3: Assess current state + gap analysis
# ---------------------------------------------------------------------------

def _assess_state(user_id: str, body: dict) -> dict:
    target_id = body.get("targetId")
    interview_answers = body.get("answers", {})

    target = _target_repo.get(user_id, target_id)
    if not target:
        return error("Career target not found", 404)

    skills = _skill_repo.query_by_user(user_id, limit=50)
    achievements = _achieve_repo.query_by_user(user_id, limit=20)
    certs = _cert_repo.query_by_user(user_id, limit=20)
    learning_goals = _lgoal_repo.query_by_gsi1(user_id, sk_begins_with="active")

    prompt = f"""목표 포지션 프로필: {json.dumps(target.get('profile', {}), ensure_ascii=False)}

현재 상태 데이터:
- 보유 스킬: {json.dumps(skills[:20], ensure_ascii=False, default=str)}
- 성과 기록: {json.dumps(achievements[:10], ensure_ascii=False, default=str)}
- 자격증: {json.dumps(certs[:10], ensure_ascii=False, default=str)}
- 학습 현황: {json.dumps(learning_goals[:5], ensure_ascii=False, default=str)}
- 인터뷰 답변: {json.dumps(interview_answers, ensure_ascii=False)}

6개 차원(core_skills, soft_skills, education, experience, network, market_fit)에 대해 갭 분석을 수행해주세요.

각 차원별로 score(0~100), currentState 요약, targetState 요약,
gaps 배열(id, name, currentLevel 0~5, requiredLevel 0~5, priority critical/important/nice_to_have),
aiDiagnosis 메시지를 포함하세요.

JSON 배열로 응답하세요."""

    raw, usage = _call_bedrock(prompt)
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])
    assessments = _parse_json(raw)
    if not isinstance(assessments, list):
        assessments = assessments.get("assessments", [])

    readiness = _calc_readiness(assessments)
    _target_repo.update(user_id, target_id, {
        "currentAssessment": assessments,
        "overallReadiness": readiness,
        "status": "active",
        "lastAssessedAt": datetime.utcnow().isoformat(),
    })

    return ok({"assessments": assessments, "overallReadiness": readiness})


# ---------------------------------------------------------------------------
# Step 4: Generate career paths
# ---------------------------------------------------------------------------

def _generate_paths(user_id: str, body: dict) -> dict:
    target_id = body.get("targetId")
    target = _target_repo.get(user_id, target_id)
    if not target:
        return error("Career target not found", 404)

    prompt = f"""목표: {target.get('title')}
현재 갭 분석: {json.dumps(target.get('currentAssessment', []), ensure_ascii=False, default=str)}

달성 가능한 2~3개의 서로 다른 경로를 생성해주세요.
각 경로는 name, description, estimatedMonths, riskLevel(low/medium/high),
salaryImpact(gradual/significant/lateral), stability(high/medium/low),
phases 배열을 포함합니다.

phases 각 항목: order, name, durationMonths, urgency(critical/important/growth),
actions 배열(title, description, order, linkedModules 배열).

linkedModules 각 항목: module(learning/tasks/schedule/relationships/finance), type(auto_created), referenceType.

JSON 배열로 응답하세요."""

    raw, usage = _call_bedrock(prompt)
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])
    paths_data = _parse_json(raw)
    if not isinstance(paths_data, list):
        paths_data = paths_data.get("paths", [])

    saved = []
    for path_data in paths_data:
        path_data["targetId"] = target_id
        path_data["isSelected"] = False
        path_data["sort_key"] = target_id
        saved_path = _path_repo.put(user_id, path_data)
        saved.append(saved_path)

    return ok(saved)


# ---------------------------------------------------------------------------
# Step 4b: Activate path — cross-module entity creation
# ---------------------------------------------------------------------------

def _activate_path(user_id: str, path_id: str, body: dict) -> dict:
    path = _path_repo.get(user_id, path_id)
    if not path:
        return error("Career path not found", 404)

    created = []
    for phase in path.get("phases", []):
        for action in phase.get("actions", []):
            for link in action.get("linkedModules", []):
                module = link.get("module")
                if module == "learning":
                    item = _lgoal_repo.put(user_id, {
                        "title": action.get("title"),
                        "field": "career",
                        "status": "active",
                        "sort_key": "active",
                        "tags": ["career-roadmap"],
                    })
                    created.append({"module": "learning", "id": item["id"]})
                elif module == "tasks":
                    item = _task_repo.put(user_id, {
                        "title": action.get("title"),
                        "status": "todo",
                        "priority": "medium",
                        "tags": ["career-roadmap"],
                        "sort_key": "todo#",
                    })
                    created.append({"module": "tasks", "id": item["id"]})

    _path_repo.update(user_id, path_id, {"isSelected": True})

    target_id = path.get("targetId")
    if target_id:
        _target_repo.update(user_id, target_id, {"selectedPathId": path_id, "status": "active"})

    return ok({"activated": path_id, "created": created})


# ---------------------------------------------------------------------------
# Step 5: Continuous coaching cycle
# ---------------------------------------------------------------------------

def _run_coaching(user_id: str, target_id: str) -> dict:
    target = _target_repo.get(user_id, target_id)
    if not target:
        return error("Career target not found", 404)

    path_id = target.get("selectedPathId")
    active_path = _path_repo.get(user_id, path_id) if path_id else None

    prompt = f"""커리어 코치로서 사용자의 진행 상황을 점검해주세요.

목표: {target.get('title')}
전체 준비도: {target.get('overallReadiness', 0)}%
마지막 평가: {target.get('lastAssessedAt', '없음')}
선택된 경로: {json.dumps(active_path, ensure_ascii=False, default=str) if active_path else '없음'}

다음 항목을 평가하고 코칭 메시지를 생성해주세요:
1. 주간 진행률 체크인
2. 경로 이탈 감지
3. 다음 단계 추천

JSON 배열로 응답하세요. 각 항목: type(checkin/deviation_alert/opportunity/milestone),
message, actionTaken(선택)"""

    raw, usage = _call_bedrock(prompt)
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])
    logs_data = _parse_json(raw)
    if not isinstance(logs_data, list):
        logs_data = logs_data.get("logs", [])

    saved = []
    for log in logs_data:
        log["targetId"] = target_id
        log["sort_key"] = f"{target_id}#{log.get('type', 'checkin')}"
        saved.append(_coach_repo.put(user_id, log))

    return ok(saved)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_user_id(event: dict) -> str | None:
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    except (KeyError, TypeError):
        return None


def _call_bedrock(user_message: str) -> tuple[str, dict]:
    response = _bedrock.invoke_model(
        modelId=_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "system": CAREER_COACH_SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": user_message}],
        }),
    )
    result = json.loads(response["body"].read())
    text = result["content"][0]["text"]
    usage = result.get("usage", {"input_tokens": 0, "output_tokens": 0})
    return text, usage


def _parse_json(raw: str) -> dict | list:
    try:
        start = raw.find("[") if "[" in raw and raw.find("[") < raw.find("{") else raw.find("{")
        if raw.count("[") > raw.count("{"):
            start = raw.find("[")
            end = raw.rfind("]") + 1
        else:
            start = raw.find("{")
            end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
    except (json.JSONDecodeError, ValueError):
        pass
    return {}


def _calc_readiness(assessments: list) -> int:
    if not assessments:
        return 0
    return round(sum(a.get("score", 0) for a in assessments) / len(assessments))
