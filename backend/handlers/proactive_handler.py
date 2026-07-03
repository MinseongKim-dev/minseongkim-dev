"""
Proactive briefing handler — triggered daily at 07:00 KST via EventBridge.

For each active user, this function:
1. Collects cross-domain data
2. Calls Bedrock to generate a personalised morning briefing
3. Stores the result as a CoachingLog so the frontend can display it
"""
from __future__ import annotations

import json
import os
from datetime import date, timedelta

import boto3

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
_coach_repo = get_repository("COACH")

_BRIEFING_PROMPT = """
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


def handler(event, context):
    """EventBridge scheduled trigger — processes all active users."""
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    users = _get_active_users()
    results = {"processed": 0, "errors": 0}

    for user_id in users:
        try:
            _generate_briefing(user_id, today, tomorrow)
            results["processed"] += 1
        except Exception:
            results["errors"] += 1

    return results


def _get_active_users() -> list[str]:
    """
    Fetch distinct userIds who have created items in the last 30 days.
    In production this would scan a user table or use Cognito list-users.
    For now returns from a synthetic ACTIVE_USERS record if it exists.
    """
    import boto3 as _b3
    import os as _os

    table = _b3.resource("dynamodb").Table(
        _os.environ.get("TABLE_NAME", "node-main-dev")
    )
    resp = table.get_item(Key={"PK": "SYSTEM", "SK": "ACTIVE_USERS"})
    item = resp.get("Item", {})
    return item.get("userIds", [])


def _generate_briefing(user_id: str, today: str, tomorrow: str) -> None:
    if not _cost_guard.within_budget(user_id):
        return

    today_events = _event_repo.query_by_gsi1(
        user_id, sk_between=(f"{today}T00:00:00", f"{today}T23:59:59")
    )
    pending_tasks = _task_repo.query_by_gsi1(user_id, sk_begins_with="todo#")
    recent_workouts = _workout_repo.query_by_user(user_id, limit=5)

    context_str = json.dumps({
        "today": today,
        "todayEvents": today_events[:5],
        "pendingTasks": pending_tasks[:10],
        "recentWorkouts": recent_workouts[:3],
    }, default=str)

    response = _bedrock.invoke_model(
        modelId=_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "system": _BRIEFING_PROMPT,
            "messages": [{"role": "user", "content": context_str}],
        }),
    )
    result = json.loads(response["body"].read())
    text = result["content"][0]["text"]
    usage = result.get("usage", {"input_tokens": 0, "output_tokens": 0})
    _cost_guard.track_usage(user_id, usage["input_tokens"], usage["output_tokens"])

    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        briefing = json.loads(text[start:end]) if start != -1 else {"summary": text}
    except json.JSONDecodeError:
        briefing = {"summary": text}

    _coach_repo.put(user_id, {
        "type": "daily_briefing",
        "date": today,
        "briefing": briefing,
        "sort_key": today,
    })
