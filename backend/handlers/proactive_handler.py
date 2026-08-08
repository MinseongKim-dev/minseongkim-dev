"""
Proactive briefing handler — triggered daily at 07:00 KST via EventBridge.

For each active user:
1. Generates an overall morning briefing (stored as daily_briefing)
2. Generates a specialist insight per domain (stored as specialist_brief_{domain})
   so each domain view can show a proactive message from its specialist.
3. Computes proactive trigger signals:
   - Task procrastination: DAY 3/5/7+ escalation
   - Recovery score: 0-100 from sleep + workout load
   - Budget burn stages: 50/70/90/100%+ per category
   - Sleep debt: weekly target vs actual
"""
from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta
from typing import Any

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
triggerAlerts가 있으면 가장 중요한 것을 먼저 언급하세요.

응답은 반드시 아래 JSON만 반환하세요:
{{
  "insight": "스페셜리스트의 선제적 메시지 (2-3문장)",
  "alertLevel": "none|low|medium|high",
  "primaryAlert": "가장 중요한 알림 (없으면 null)"
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
    signals = _compute_trigger_signals(ctx, today)

    # Store computed signals for frontend access
    _coach_repo.put(user_id, {
        "type": "trigger_signals",
        "date": today,
        "signals": signals,
        "sort_key": f"{today}#signals",
    })

    # 1. Overall morning briefing
    if _cost_guard.within_budget(user_id):
        _generate_overall_briefing(user_id, today, ctx)

    # 2. Per-domain specialist insights with trigger context
    domain_context_builders = {
        "schedule": lambda: {
            "todayEvents": ctx["todayEvents"],
            "pendingTasks": ctx["pendingTasks"],
            "triggerAlerts": signals.get("schedule", []),
        },
        "tasks": lambda: {
            "pendingTasks": ctx["pendingTasks"],
            "triggerAlerts": signals.get("tasks", []),
        },
        "finance": lambda: {
            "recentTransactions": ctx["recentTransactions"],
            "triggerAlerts": signals.get("finance", []),
        },
        "health": lambda: {
            "recentWorkouts": ctx["recentWorkouts"],
            "recentSleep": ctx["recentSleep"],
            "recoveryScore": signals.get("recoveryScore"),
            "sleepDebt": signals.get("sleepDebt"),
            "triggerAlerts": signals.get("health", []),
        },
        "learning": lambda: {
            "recentBooks": ctx["recentBooks"],
            "triggerAlerts": signals.get("learning", []),
        },
        "career": lambda: {
            "skills": ctx["skills"],
            "triggerAlerts": signals.get("career", []),
        },
        "relationships": lambda: {
            "contacts": ctx["contacts"],
            "triggerAlerts": signals.get("relationships", []),
        },
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
        "recentWorkouts": _workout_repo.query_by_user(user_id, limit=7),
        "recentSleep": _sleep_repo.query_by_user(user_id, limit=7),
        "recentBooks": _book_repo.query_by_user(user_id, limit=5),
        "contacts": _contact_repo.query_by_user(user_id, limit=20),
        "skills": _skill_repo.query_by_user(user_id, limit=20),
    }


# ---------------------------------------------------------------------------
# Trigger signal computation
# ---------------------------------------------------------------------------

def _compute_trigger_signals(ctx: dict, today: str) -> dict[str, Any]:
    """Compute all v2.0 proactive trigger signals from raw context data."""
    signals: dict[str, Any] = {}

    signals["tasks"] = _detect_task_procrastination(ctx["pendingTasks"], today)
    recovery_score, recovery_alerts = _compute_recovery_score(
        ctx["recentWorkouts"], ctx["recentSleep"], today
    )
    signals["recoveryScore"] = recovery_score
    sleep_debt, sleep_alerts = _compute_sleep_debt(ctx["recentSleep"])
    signals["sleepDebt"] = sleep_debt
    signals["health"] = recovery_alerts + sleep_alerts
    signals["finance"] = _detect_budget_burn(ctx["recentTransactions"])
    signals["relationships"] = _detect_neglected_contacts(ctx["contacts"], today)
    signals["schedule"] = []
    signals["learning"] = []
    signals["career"] = []

    return signals


def _detect_task_procrastination(tasks: list[dict], today: str) -> list[dict]:
    """DAY 3/5/7+ escalating intervention for stalled tasks."""
    today_dt = date.fromisoformat(today)
    alerts = []

    for task in tasks:
        created_str = task.get("createdAt") or task.get("created_at") or task.get("date")
        if not created_str:
            continue
        try:
            created_dt = date.fromisoformat(str(created_str)[:10])
        except (ValueError, TypeError):
            continue
        days_pending = (today_dt - created_dt).days
        title = task.get("title") or task.get("name") or "작업"

        if days_pending >= 7:
            alerts.append({
                "type": "procrastination",
                "level": "high",
                "days": days_pending,
                "task": title,
                "action": "decompose",
                "message": f"'{title}' 이(가) {days_pending}일째 대기 중입니다. 지금 바로 작은 단계로 분해하세요.",
            })
        elif days_pending >= 5:
            alerts.append({
                "type": "procrastination",
                "level": "medium",
                "days": days_pending,
                "task": title,
                "action": "analyze",
                "message": f"'{title}' 이(가) {days_pending}일째 멈춰 있습니다. 무엇이 막고 있는지 분석이 필요합니다.",
            })
        elif days_pending >= 3:
            alerts.append({
                "type": "procrastination",
                "level": "low",
                "days": days_pending,
                "task": title,
                "action": "nudge",
                "message": f"'{title}' 이(가) {days_pending}일이 지났습니다. 오늘 시작해볼까요?",
            })

    # Surface highest-severity alerts first, cap at 3
    alerts.sort(key=lambda a: {"high": 0, "medium": 1, "low": 2}[a["level"]])
    return alerts[:3]


def _compute_recovery_score(workouts: list[dict], sleep_logs: list[dict], today: str) -> tuple[int, list[dict]]:
    """
    Recovery score 0-100:
      - Sleep component (0-50): avg sleep duration vs 8h target over last 7 days
      - Workout component (0-50): inverse of recent training load (rest = full points)
    Bands: HIGH 80+, MEDIUM 50-79, LOW <50
    """
    today_dt = date.fromisoformat(today)
    alerts = []

    # Sleep score (0-50)
    recent_sleep = []
    for log in sleep_logs:
        log_date_str = log.get("date") or log.get("startTime") or log.get("createdAt")
        if not log_date_str:
            continue
        try:
            log_dt = date.fromisoformat(str(log_date_str)[:10])
        except (ValueError, TypeError):
            continue
        if (today_dt - log_dt).days <= 7:
            duration = float(log.get("duration") or log.get("hours") or 0)
            recent_sleep.append(duration)

    if recent_sleep:
        avg_sleep = sum(recent_sleep) / len(recent_sleep)
        # 8h = perfect sleep score; scale linearly, cap at 50
        sleep_score = min(50, int((avg_sleep / 8.0) * 50))
    else:
        sleep_score = 25  # unknown, neutral

    # Workout load score (0-50): fewer/lighter recent workouts = higher recovery
    recent_workout_intensities = []
    intensity_map = {"low": 1, "medium": 2, "high": 3, "very_high": 4}
    for w in workouts:
        w_date_str = w.get("date") or w.get("createdAt")
        if not w_date_str:
            continue
        try:
            w_dt = date.fromisoformat(str(w_date_str)[:10])
        except (ValueError, TypeError):
            continue
        days_ago = (today_dt - w_dt).days
        if days_ago <= 3:
            intensity = intensity_map.get(str(w.get("intensity") or "medium").lower(), 2)
            # Closer + higher intensity = more fatigue
            fatigue = intensity * max(0, (4 - days_ago))
            recent_workout_intensities.append(fatigue)

    total_fatigue = sum(recent_workout_intensities)
    # Max fatigue = 4 workouts × 4 intensity × 3 days_weight = 48; invert for score
    workout_score = max(0, min(50, 50 - int(total_fatigue * 1.5)))

    recovery_score = sleep_score + workout_score

    # Generate alerts based on band
    if recovery_score < 40:
        alerts.append({
            "type": "recovery",
            "level": "high",
            "score": recovery_score,
            "band": "LOW",
            "message": f"회복도 {recovery_score}/100 — 오늘은 고강도 운동을 피하고 충분한 휴식을 취하세요.",
        })
    elif recovery_score < 65:
        alerts.append({
            "type": "recovery",
            "level": "medium",
            "score": recovery_score,
            "band": "MEDIUM",
            "message": f"회복도 {recovery_score}/100 — 중간 강도 운동과 스트레칭이 적합합니다.",
        })

    return recovery_score, alerts


def _compute_sleep_debt(sleep_logs: list[dict]) -> tuple[float, list[dict]]:
    """
    Weekly sleep debt: 7 × 8h target vs actual sleep logged in last 7 days.
    Returns (debt_hours, alerts).
    """
    NIGHTLY_TARGET = 8.0
    weekly_target = NIGHTLY_TARGET * 7
    alerts = []

    total_actual = 0.0
    for log in sleep_logs[:7]:
        duration = float(log.get("duration") or log.get("hours") or 0)
        total_actual += duration

    debt = max(0.0, round(weekly_target - total_actual, 1))

    if debt >= 10:
        alerts.append({
            "type": "sleep_debt",
            "level": "high",
            "debt_hours": debt,
            "message": f"주간 수면 부채 {debt}시간 — 만성 수면 부족 상태입니다. 이번 주말 회복을 우선시하세요.",
        })
    elif debt >= 5:
        alerts.append({
            "type": "sleep_debt",
            "level": "medium",
            "debt_hours": debt,
            "message": f"주간 수면 부채 {debt}시간 — 오늘 30분 일찍 취침하는 것을 권장합니다.",
        })

    return debt, alerts


def _detect_budget_burn(transactions: list[dict]) -> list[dict]:
    """
    4-stage budget burn monitoring per category:
      Stage 1 (50%): 조기 경보
      Stage 2 (70%): 경고
      Stage 3 (90%): 위험
      Stage 4 (100%+): 초과
    Requires transactions to include 'category', 'amount', 'budget' fields.
    """
    alerts = []
    category_data: dict[str, dict] = {}

    for txn in transactions:
        category = str(txn.get("category") or "기타")
        amount = float(txn.get("amount") or 0)
        budget = float(txn.get("budget") or 0)
        if category not in category_data:
            category_data[category] = {"spent": 0.0, "budget": budget}
        category_data[category]["spent"] += amount
        # Take max budget seen for this category
        if budget > category_data[category]["budget"]:
            category_data[category]["budget"] = budget

    for category, data in category_data.items():
        budget = data["budget"]
        if budget <= 0:
            continue
        spent = data["spent"]
        burn_pct = spent / budget * 100

        if burn_pct >= 100:
            alerts.append({
                "type": "budget_burn",
                "stage": 4,
                "level": "high",
                "category": category,
                "burn_pct": round(burn_pct, 1),
                "message": f"{category} 예산 초과 ({burn_pct:.0f}%) — 즉시 지출을 중단하고 대안을 찾으세요.",
            })
        elif burn_pct >= 90:
            alerts.append({
                "type": "budget_burn",
                "stage": 3,
                "level": "high",
                "category": category,
                "burn_pct": round(burn_pct, 1),
                "message": f"{category} 예산 {burn_pct:.0f}% 소진 — 위험 단계입니다. 나머지 지출을 최소화하세요.",
            })
        elif burn_pct >= 70:
            alerts.append({
                "type": "budget_burn",
                "stage": 2,
                "level": "medium",
                "category": category,
                "burn_pct": round(burn_pct, 1),
                "message": f"{category} 예산 {burn_pct:.0f}% 소진 — 이번 달 남은 지출을 신중하게 계획하세요.",
            })
        elif burn_pct >= 50:
            alerts.append({
                "type": "budget_burn",
                "stage": 1,
                "level": "low",
                "category": category,
                "burn_pct": round(burn_pct, 1),
                "message": f"{category} 예산 {burn_pct:.0f}% 소진 — 월 중반 기준 정상 범위입니다.",
            })

    # Sort by stage descending (most critical first)
    alerts.sort(key=lambda a: -a["stage"])
    return alerts[:5]


def _detect_neglected_contacts(contacts: list[dict], today: str) -> list[dict]:
    """
    Relationship tier-based contact interval monitoring.
    Tier 1 (5명): 2주, Tier 2 (15명): 월 1회, Tier 3 (50명): 분기 1회, Tier 4: 반기
    """
    today_dt = date.fromisoformat(today)
    tier_intervals = {1: 14, 2: 30, 3: 90, 4: 180}
    alerts = []

    for contact in contacts:
        tier = int(contact.get("tier") or 4)
        interval = tier_intervals.get(tier, 180)
        last_contact_str = contact.get("lastContact") or contact.get("last_contact")
        name = contact.get("name") or "연락처"

        if not last_contact_str:
            # Never contacted — flag Tier 1/2
            if tier <= 2:
                alerts.append({
                    "type": "neglected_contact",
                    "level": "medium",
                    "tier": tier,
                    "contact": name,
                    "days_since": None,
                    "message": f"Tier {tier} 연락처 {name}에게 아직 연락하지 않았습니다.",
                })
            continue

        try:
            last_dt = date.fromisoformat(str(last_contact_str)[:10])
        except (ValueError, TypeError):
            continue

        days_since = (today_dt - last_dt).days
        overdue_days = days_since - interval

        if overdue_days > 0:
            level = "high" if tier <= 2 else "low"
            alerts.append({
                "type": "neglected_contact",
                "level": level,
                "tier": tier,
                "contact": name,
                "days_since": days_since,
                "overdue_days": overdue_days,
                "message": f"Tier {tier} {name}: {days_since}일 미연락 (권장 {interval}일 주기)",
            })

    alerts.sort(key=lambda a: (a["tier"], -(a.get("overdue_days") or 0)))
    return alerts[:5]


# ---------------------------------------------------------------------------
# Bedrock generation helpers
# ---------------------------------------------------------------------------

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
        alert_level = parsed.get("alertLevel", "none")
        primary_alert = parsed.get("primaryAlert")
    except json.JSONDecodeError:
        insight = text
        alert_level = "none"
        primary_alert = None

    _coach_repo.put(user_id, {
        "type": "specialist_brief",
        "domain": domain,
        "date": today,
        "insight": insight,
        "alertLevel": alert_level,
        "primaryAlert": primary_alert,
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
