"""
Notification handler — EventBridge scheduled triggers.

Schedules:
  09:00 KST daily  → deadline reminders, birthday alerts
  09:00 KST Sunday → weekly review nudge
"""
from __future__ import annotations

import json
import os
from datetime import date, timedelta

import boto3

from repositories import get_repository

_SES_FROM = os.environ.get("SES_FROM_EMAIL", "")
_FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://example.com")
_ses = boto3.client("ses", region_name=os.environ.get("AWS_REGION", "ap-northeast-2"))

_task_repo = get_repository("TASK")
_contact_repo = get_repository("CONTACT")
_event_repo = get_repository("EVENT")

# Synthetic user registry — same pattern as proactive_handler
def _get_active_users() -> list[dict]:
    import boto3 as _b3
    table = _b3.resource("dynamodb").Table(os.environ.get("TABLE_NAME", "node-main-dev"))
    resp = table.get_item(Key={"PK": "SYSTEM", "SK": "ACTIVE_USERS"})
    return resp.get("Item", {}).get("users", [])  # [{userId, email}]


def handler(event, context):
    today = date.today()
    is_sunday = today.weekday() == 6
    results = {"processed": 0, "errors": 0, "emails_sent": 0}

    if not _SES_FROM:
        return {"error": "SES_FROM_EMAIL not configured"}

    users = _get_active_users()
    for user in users:
        user_id = user.get("userId")
        email = user.get("email")
        if not user_id or not email:
            continue
        try:
            sent = _process_user(user_id, email, today, is_sunday)
            results["emails_sent"] += sent
            results["processed"] += 1
        except Exception:
            results["errors"] += 1

    return results


def _process_user(user_id: str, email: str, today: date, is_sunday: bool) -> int:
    sent = 0
    alerts: list[str] = []

    # Tasks due today or overdue
    tasks = _task_repo.query_by_user(user_id, limit=50)
    due_today = [
        t for t in tasks
        if t.get("dueDate", "")[:10] == today.isoformat() and t.get("status") != "done"
    ]
    overdue = [
        t for t in tasks
        if t.get("dueDate", "")[:10] < today.isoformat() and t.get("status") != "done"
    ]

    if due_today:
        alerts.append(f"📌 오늘 마감 할일 {len(due_today)}개: " + ", ".join(t["title"] for t in due_today[:3]))
    if overdue:
        alerts.append(f"⚠️ 기한 초과 할일 {len(overdue)}개 있습니다.")

    # Birthdays in next 7 days
    contacts = _contact_repo.query_by_user(user_id, limit=100)
    for c in contacts:
        bday = c.get("birthday", "")
        if not bday:
            continue
        try:
            month_day = bday[5:]  # MM-DD
            this_year = f"{today.year}-{month_day}"
            bday_date = date.fromisoformat(this_year)
            days_until = (bday_date - today).days
            if 0 <= days_until <= 7:
                alerts.append(f"🎂 {c['name']}님의 생일이 {days_until}일 후입니다!")
        except ValueError:
            pass

    # Weekly review nudge
    if is_sunday:
        alerts.append("📊 이번 주 리뷰를 작성할 시간입니다.")

    if not alerts:
        return 0

    body_html = "<br>".join(f"<p>{a}</p>" for a in alerts)
    _ses.send_email(
        Source=_SES_FROM,
        Destination={"ToAddresses": [email]},
        Message={
            "Subject": {"Data": f"[Node] 오늘의 알림 — {today.isoformat()}"},
            "Body": {
                "Html": {
                    "Data": f"""
<html><body style="font-family: sans-serif; color: #1a1a2e; padding: 24px;">
  <h2 style="color:#3B8EF0">Node 알림</h2>
  {body_html}
  <hr>
  <p><a href="{_FRONTEND_URL}" style="color:#3B8EF0">앱 열기</a></p>
</body></html>"""
                }
            },
        },
    )
    return 1
