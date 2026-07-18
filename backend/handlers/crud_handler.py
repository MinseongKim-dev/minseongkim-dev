from __future__ import annotations

import json

from repositories import get_repository
from utils.response import error, ok

DOMAIN_MAP: dict[str, str] = {
    "events": "EVENT",
    "tasks": "TASK",
    "projects": "PROJECT",
    "transactions": "TXN",
    "budgets": "BUDGET",
    "savings-goals": "SAVING",
    "workouts": "WORKOUT",
    "sleep": "SLEEP",
    "health": "HEALTH",
    "weight": "WEIGHT",
    "water": "WATER",
    "steps": "STEPS",
    "mood": "MOOD",
    "learning": "LGOAL",
    "study": "STUDY",
    "books": "BOOK",
    "flashcards": "FLASH",
    "contacts": "CONTACT",
    "meetings": "MEETING",
    "career-goals": "CGOAL",
    "skills": "SKILL",
    "achievements": "ACHIEVE",
    "job-apps": "JOBAPP",
    "journals": "JOURNAL",
    "certs": "CERT",
    "salary": "SALARY",
    "work-logs": "WLOG",
    "career-targets": "TARGET",
    "targets": "TARGET",
    "career-paths": "CPATH",
    "cpaths": "CPATH",
    "coaching": "COACH",
    "coachlogs": "CLOG",
}


def handler(event, context):
    user_id = _extract_user_id(event)
    if not user_id:
        return error("Unauthorized", 401)

    method = event["requestContext"]["http"]["method"]
    path_params = event.get("pathParameters") or {}
    domain = path_params.get("domain", "")
    item_id = path_params.get("id")
    query_params = event.get("queryStringParameters") or {}

    prefix = DOMAIN_MAP.get(domain)
    if not prefix:
        return error(f"Unknown domain: {domain}", 404)

    repo = get_repository(prefix)

    if method == "GET":
        if item_id:
            item = repo.get(user_id, item_id)
            if not item:
                return error("Not found", 404)
            return ok(item)
        begins_with = query_params.get("begins_with")
        limit = int(query_params.get("limit", 100))
        items = repo.query_by_user(user_id, begins_with=begins_with, limit=limit)
        return ok(items)

    if method == "POST":
        data = json.loads(event.get("body") or "{}")
        item = repo.put(user_id, data)
        return ok(item, 201)

    if method == "PUT":
        if not item_id:
            return error("id is required", 400)
        data = json.loads(event.get("body") or "{}")
        updated = repo.update(user_id, item_id, data)
        return ok(updated)

    if method == "DELETE":
        if not item_id:
            return error("id is required", 400)
        repo.delete(user_id, item_id)
        return ok({"deleted": item_id})

    return error(f"Method not allowed: {method}", 405)


def _extract_user_id(event: dict) -> str | None:
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    except (KeyError, TypeError):
        return None
