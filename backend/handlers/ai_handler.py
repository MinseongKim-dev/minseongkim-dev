from __future__ import annotations

import json
import os
import uuid
from datetime import date, datetime

import boto3

from prompts.specialists import get_specialist_prompt
from prompts.system import BASE_SYSTEM_PROMPT, build_system_prompt
from repositories import get_repository
from utils.cost_guard import BedrockCostGuard
from utils.response import error, ok

_BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-20250514")
_bedrock = boto3.client("bedrock-runtime", region_name=_BEDROCK_REGION)
_cost_guard = BedrockCostGuard()

_event_repo = get_repository("EVENT")
_task_repo = get_repository("TASK")
_txn_repo = get_repository("TXN")
_career_repo = get_repository("TARGET")
_skill_repo = get_repository("SKILL")
_msg_repo = get_repository("MSG")


def handler(event, context):
    user_id = _extract_user_id(event)
    if not user_id:
        return error("Unauthorized", 401)

    if not _cost_guard.within_budget(user_id):
        return error("Monthly AI budget exceeded. Please try again next month.", 429)

    body = json.loads(event.get("body") or "{}")
    user_input = body.get("message", "").strip()
    history = body.get("history", [])[-10:]

    if not user_input:
        return error("message is required", 400)

    ctx = _build_context(user_id)
    messages = _format_messages(history, user_input, ctx)

    domain_hint = body.get("domain")
    specialist_prompt = get_specialist_prompt(domain_hint) if domain_hint else None
    system_prompt = build_system_prompt(specialist_prompt)

    try:
        raw, usage = _call_bedrock(messages, system_prompt)
    except Exception as exc:
        return error(f"AI service error: {exc}", 502)

    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])

    parsed = _parse_response(raw)
    _execute_actions(user_id, parsed.get("actions", []))
    _save_message(user_id, user_input, parsed.get("response", raw))

    return ok({
        "message": parsed.get("response", raw),
        "followUp": parsed.get("followUp"),
        "visualizations": parsed.get("visualizations", []),
        "domain": parsed.get("domain"),
        "intent": parsed.get("intent"),
    })


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_user_id(event: dict) -> str | None:
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    except (KeyError, TypeError):
        return None


def _build_context(user_id: str) -> dict:
    today = date.today().isoformat()
    events = _event_repo.query_by_gsi1(
        user_id,
        sk_between=(f"{today}T00:00:00", f"{today}T23:59:59"),
    )
    tasks = _task_repo.query_by_gsi1(user_id, sk_begins_with="todo#")
    return {
        "today": today,
        "todayEvents": events[:5],
        "pendingTasks": tasks[:10],
    }


def _format_messages(history: list, user_input: str, ctx: dict) -> list:
    context_note = (
        f"\n\n[현재 컨텍스트: 오늘={ctx['today']}, "
        f"오늘 일정={len(ctx['todayEvents'])}개, "
        f"미완료 태스크={len(ctx['pendingTasks'])}개]"
    )
    messages = list(history)
    messages.append({"role": "user", "content": user_input + context_note})
    return messages


def _call_bedrock(messages: list, system_prompt: str | None = None) -> tuple[str, dict]:
    response = _bedrock.invoke_model(
        modelId=_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "system": system_prompt or BASE_SYSTEM_PROMPT,
            "messages": messages,
        }),
    )
    result = json.loads(response["body"].read())
    text = result["content"][0]["text"]
    usage = result.get("usage", {"input_tokens": 0, "output_tokens": 0})
    return text, usage


def _parse_response(raw: str) -> dict:
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
    except json.JSONDecodeError:
        pass
    return {"response": raw}


def _execute_actions(user_id: str, actions: list[dict]) -> None:
    domain_map = {
        "events": "EVENT", "tasks": "TASK", "projects": "PROJECT",
        "transactions": "TXN", "budgets": "BUDGET", "savings-goals": "SAVING",
        "workouts": "WORKOUT", "sleep": "SLEEP", "health": "HEALTH",
        "weight": "WEIGHT", "water": "WATER", "steps": "STEPS", "mood": "MOOD",
        "learning": "LGOAL", "study": "STUDY", "books": "BOOK", "flashcards": "FLASH",
        "contacts": "CONTACT", "meetings": "MEETING",
        "career-goals": "CGOAL", "skills": "SKILL", "achievements": "ACHIEVE",
        "job-apps": "JOBAPP", "journals": "JOURNAL", "certs": "CERT",
        "salary": "SALARY", "work-logs": "WLOG",
        "career-targets": "TARGET", "targets": "TARGET",
        "career-paths": "CPATH", "cpaths": "CPATH",
        "coaching": "COACH", "coachlogs": "CLOG",
    }
    for action in actions:
        if action.get("type") != "db_operation":
            continue
        domain = action.get("domain", "")
        prefix = domain_map.get(domain)
        if not prefix:
            continue
        repo = get_repository(prefix)
        operation = action.get("operation")
        data = action.get("data", {})
        item_id = data.get("id")
        if operation == "create":
            repo.put(user_id, data)
        elif operation == "update" and item_id:
            repo.update(user_id, item_id, data)
        elif operation == "delete" and item_id:
            repo.delete(user_id, item_id)


def _save_message(user_id: str, user_input: str, ai_response: str) -> None:
    now = datetime.utcnow().isoformat()
    msg_id = str(uuid.uuid4())
    _msg_repo.put(user_id, {
        "id": f"{now}#{msg_id}",
        "role": "user",
        "content": user_input,
        "sort_key": now,
    })
    _msg_repo.put(user_id, {
        "id": f"{now}#{str(uuid.uuid4())}",
        "role": "assistant",
        "content": ai_response,
        "sort_key": now,
    })
