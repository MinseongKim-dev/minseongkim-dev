from __future__ import annotations

import os
from datetime import datetime

import boto3

_TABLE_NAME = os.environ.get("TABLE_NAME", "node-main-dev")
_MONTHLY_BUDGET = float(os.environ.get("MONTHLY_AI_BUDGET", "10.0"))
_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(_TABLE_NAME)

INPUT_COST_PER_1K = 0.003
OUTPUT_COST_PER_1K = 0.015


class BedrockCostGuard:
    """Tracks per-user Bedrock token usage and enforces a monthly budget."""

    def track_usage(self, user_id: str, input_tokens: int, output_tokens: int) -> None:
        month_key = datetime.utcnow().strftime("%Y-%m")
        estimated = round(
            (input_tokens / 1000) * INPUT_COST_PER_1K
            + (output_tokens / 1000) * OUTPUT_COST_PER_1K,
            6,
        )
        _table.update_item(
            Key={"PK": f"USAGE#{user_id}", "SK": f"MONTH#{month_key}"},
            UpdateExpression=(
                "ADD inputTokens :inp, outputTokens :out, estimatedCost :cost"
            ),
            ExpressionAttributeValues={
                ":inp": input_tokens,
                ":out": output_tokens,
                ":cost": estimated,
            },
        )

    def within_budget(self, user_id: str) -> bool:
        month_key = datetime.utcnow().strftime("%Y-%m")
        resp = _table.get_item(
            Key={"PK": f"USAGE#{user_id}", "SK": f"MONTH#{month_key}"}
        )
        spent = float(resp.get("Item", {}).get("estimatedCost", 0))
        return spent < _MONTHLY_BUDGET

    def get_usage(self, user_id: str) -> dict:
        month_key = datetime.utcnow().strftime("%Y-%m")
        resp = _table.get_item(
            Key={"PK": f"USAGE#{user_id}", "SK": f"MONTH#{month_key}"}
        )
        item = resp.get("Item", {})
        return {
            "month": month_key,
            "inputTokens": int(item.get("inputTokens", 0)),
            "outputTokens": int(item.get("outputTokens", 0)),
            "estimatedCostUsd": float(item.get("estimatedCost", 0)),
            "budgetUsd": _MONTHLY_BUDGET,
            "remainingUsd": _MONTHLY_BUDGET - float(item.get("estimatedCost", 0)),
        }
