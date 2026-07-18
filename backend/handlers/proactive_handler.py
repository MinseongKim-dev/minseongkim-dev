"""
Proactive briefing handler — triggered daily at 07:00 KST via EventBridge.

For each active user:
1. Generates an overall morning briefing (stored as daily_briefing)
2. Generates a specialist insight per domain (stored as specialist_brief_{domain})
   so each domain view can show a proactive message from its specialist.
"""
from __future__ import annotations

import json
import os
from datetime import date, timedelta

import boto3

from prompts.specialists import SPECIALISTS, get_specialist_prompt
from repositories import get_repository
from utils.cost_guard import BedrockCostGuard

_BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-20250514")
_bedrock = boto3.client("bedrock-runtime", region_name=_BEDROCK_REGION)
_cost_guard = BedrockCostGuard()

_event_repo = get_repository("EVENT")
_task_repo = get_repository("TASK")
_txn_repo = get_repository("TXN")
_workout_repo = get_repository("WORKOUT")
_sleep_repo = get_repository("SLEEP")
_book_repo = get_repository("BOOK")
_contact_repo = get_repository("CONTACT")
_skill_repo = get_repository("SKILL")
_coach_repo = get_repository("COACH")

_OVERALL_BRIEFING_PROMPT = """
당신은 Node 앱의 AI 어시스턴트입니다. 사용자의 하루 시작을 돕는
아침 브리핑을 작성해주세요. 데이터를 기반으로 오늘의 핵심 포인트를
간결하게 정리하고 선제적 제안을 포함하세요.

응답은 아래 JSON 형식을 따르세요:
{
  "greeting": "안녕하세요! 오늘의 브리핑입니다.",
  "summary": "오늘의 핵심 3줄 요약",
  "highlights": [
    {"type": "schedule|task|finance|health|career", "message": "...", "priority": "high|medium|low"}
  ],
  "suggestions": ["제안1", "제안2"],
  "motivationalNote": "오늘 하루 응원 메시지"
}
"""

_SPECIALIST_BRIEF_PROMPT = """
{specialist_prompt}

위의 스페셜리스트 역할로, 사용자 데이터를 분석해 오늘의 선제적 한마디를 작성하세요.
2-3문장으로 간결하게, 구체적인 수치를 포함하고, 즉시 실행 가능한 제안을 담아야 합니다.

응답은 반드시 아래 JSON만 반환하세요:
{{
  "insight": "스페셜리스트의 선제적 메시지 (2-3문장)"
}}
"""


def handler(event, context):
    today = date.today().isoformat()
    users = _get_active_users()
    results = {"processed": 0, "errors": 0}

    for user_id in users:
        try:
            _run_for_user(user_id, today)
            results["processed"] += 1
        except Exception:
            results["errors"] += 1

    return results


def _get_active_users() -> list[str]:
    import boto3 as _b3
    import os as _os
    table = _b3.resource("dynamodb").Table(
        _os.environ.get("TABLE_NAME", "node-main-dev")
    )
    resp = table.get_item(Key={"PK": "SYSTEM", "SK": "ACTIVE_USERS"})
    return resp.get("Item", {}).get("userIds", [])


def _run_for_user(user_id: str, today: str) -> None:
    tomorrow = (date.fromisoformat(today) + timedelta(days=1)).isoformat()

    ctx = _build_context(user_id, today, tomorrow)

    # 1. Overall morning briefing
    if _cost_guard.within_budget(user_id):
        _generate_overall_briefing(user_id, today, ctx)

    # 2. Per-domain specialist insights
    domain_context_builders = {
        "schedule": lambda: {"todayEvents": ctx["todayEvents"], "pendingTasks": ctx["pendingTasks"]},
        "tasks": lambda: {"pendingTasks": ctx["pendingTasks"]},
        "finance": lambda: {"recentTransactions": ctx["recentTransactions"]},
        "health": lambda: {"recentWorkouts": ctx["recentWorkouts"], "recentSleep": ctx["recentSleep"]},
        "learning": lambda: {"recentBooks": ctx["recentBooks"]},
        "career": lambda: {"skills": ctx["skills"]},
        "relationships": lambda: {"contacts": ctx["contacts"]},
    }

    for domain, build_ctx in domain_context_builders.items():
        if not _cost_guard.within_budget(user_id):
            break
        try:
            _generate_specialist_insight(user_id, today, domain, build_ctx())
        except Exception:
            pass


def _build_context(user_id: str, today: str, tomorrow: str) -> dict:
    return {
        "today": today,
        "todayEvents": _event_repo.query_by_gsi1(
            user_id, sk_between=(f"{today}T00:00:00", f"{today}T23:59:59")
        )[:5],
        "pendingTasks": _task_repo.query_by_gsi1(user_id, sk_begins_with="todo#")[:10],
        "recentTransactions": _txn_repo.query_by_user(user_id, limit=10),
        "recentWorkouts": _workout_repo.query_by_user(user_id, limit=5),
        "recentSleep": _sleep_repo.query_by_user(user_id, limit=7),
        "recentBooks": _book_repo.query_by_user(user_id, limit=5),
        "contacts": _contact_repo.query_by_user(user_id, limit=20),
        "skills": _skill_repo.query_by_user(user_id, limit=20),
    }


def _generate_overall_briefing(user_id: str, today: str, ctx: dict) -> None:
    context_str = json.dumps({
        "today": ctx["today"],
        "todayEvents": ctx["todayEvents"],
        "pendingTasks": ctx["pendingTasks"],
        "recentWorkouts": ctx["recentWorkouts"],
    }, default=str)

    text, usage = _call_bedrock(_OVERALL_BRIEFING_PROMPT, context_str)
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])

    try:
        s, e = text.find("{"), text.rfind("}") + 1
        briefing = json.loads(text[s:e]) if s != -1 else {"summary": text}
    except json.JSONDecodeError:
        briefing = {"summary": text}

    _coach_repo.put(user_id, {
        "type": "daily_briefing",
        "date": today,
        "briefing": briefing,
        "sort_key": today,
    })


def _generate_specialist_insight(user_id: str, today: str, domain: str, domain_ctx: dict) -> None:
    specialist_prompt = get_specialist_prompt(domain)
    if not specialist_prompt:
        return

    system = _SPECIALIST_BRIEF_PROMPT.format(specialist_prompt=specialist_prompt)
    context_str = json.dumps({"today": today, **domain_ctx}, default=str)

    text, usage = _call_bedrock(system, context_str, max_tokens=512)
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])

    try:
        s, e = text.find("{"), text.rfind("}") + 1
        parsed = json.loads(text[s:e]) if s != -1 else {}
        insight = parsed.get("insight", text)
    except json.JSONDecodeError:
        insight = text

    _coach_repo.put(user_id, {
        "type": f"specialist_brief",
        "domain": domain,
        "date": today,
        "insight": insight,
        "sort_key": f"{today}#{domain}",
    })


def _call_bedrock(system: str, user_content: str, max_tokens: int = 1024) -> tuple[str, dict]:
    response = _bedrock.invoke_model(
        modelId=_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user_content}],
        }),
    )
    result = json.loads(response["body"].read())
    text = result["content"][0]["text"]
    usage = result.get("usage", {"input_tokens": 0, "output_tokens": 0})
    return text, usage
