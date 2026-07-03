from __future__ import annotations

import os
import uuid
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key

_TABLE_NAME = os.environ.get("TABLE_NAME", "node-main-dev")
_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(_TABLE_NAME)


class BaseRepository:
    """
    Single Table Design repository base.

    PK  = USER#{userId}
    SK  = {prefix}#{id}
    GSI1PK = {prefix}           (entity type)
    GSI1SK = {sort_key}         (date, status#date, etc.)
    GSI2PK = USER#{userId}#{prefix}
    GSI2SK = {custom_sort_key}  (priority#dueDate, etc.)
    """

    def __init__(self, entity_prefix: str):
        self.prefix = entity_prefix

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def put(self, user_id: str, data: dict) -> dict:
        item_id = data.pop("id", None) or str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        item = {
            "PK": f"USER#{user_id}",
            "SK": f"{self.prefix}#{item_id}",
            "GSI1PK": self.prefix,
            "GSI1SK": data.pop("sort_key", now),
            "GSI2PK": f"USER#{user_id}#{self.prefix}",
            "GSI2SK": data.pop("custom_sort_key", now),
            "id": item_id,
            "userId": user_id,
            "createdAt": now,
            "updatedAt": now,
            **data,
        }
        _table.put_item(Item=item)
        return item

    def update(self, user_id: str, item_id: str, data: dict) -> dict:
        now = datetime.utcnow().isoformat()
        data["updatedAt"] = now
        data.pop("PK", None)
        data.pop("SK", None)

        update_expr = "SET " + ", ".join(f"#k{i} = :v{i}" for i, _ in enumerate(data))
        names = {f"#k{i}": k for i, k in enumerate(data)}
        values = {f":v{i}": v for i, v in enumerate(data.values())}

        resp = _table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"{self.prefix}#{item_id}"},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
            ReturnValues="ALL_NEW",
        )
        return resp.get("Attributes", {})

    def delete(self, user_id: str, item_id: str) -> None:
        _table.delete_item(
            Key={"PK": f"USER#{user_id}", "SK": f"{self.prefix}#{item_id}"}
        )

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, user_id: str, item_id: str) -> dict | None:
        resp = _table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"{self.prefix}#{item_id}"}
        )
        return resp.get("Item")

    def query_by_user(
        self,
        user_id: str,
        begins_with: str | None = None,
        limit: int | None = None,
        last_key: dict | None = None,
    ) -> list[dict]:
        sk_prefix = f"{self.prefix}#{begins_with}" if begins_with else f"{self.prefix}#"
        params: dict = {
            "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}")
            & Key("SK").begins_with(sk_prefix),
        }
        if limit:
            params["Limit"] = limit
        if last_key:
            params["ExclusiveStartKey"] = last_key
        return _table.query(**params).get("Items", [])

    def query_by_gsi1(
        self,
        user_id: str,
        sk_begins_with: str | None = None,
        sk_between: tuple[str, str] | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        if sk_between:
            key_cond = Key("GSI1PK").eq(self.prefix) & Key("GSI1SK").between(
                sk_between[0], sk_between[1]
            )
        elif sk_begins_with:
            key_cond = Key("GSI1PK").eq(self.prefix) & Key("GSI1SK").begins_with(
                sk_begins_with
            )
        else:
            key_cond = Key("GSI1PK").eq(self.prefix)

        params: dict = {
            "IndexName": "GSI1-TypeDate",
            "KeyConditionExpression": key_cond,
            "FilterExpression": Key("PK").eq(f"USER#{user_id}"),
        }
        if limit:
            params["Limit"] = limit
        return _table.query(**params).get("Items", [])

    def query_by_gsi2(
        self,
        user_id: str,
        sk_begins_with: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        key_cond = Key("GSI2PK").eq(f"USER#{user_id}#{self.prefix}")
        if sk_begins_with:
            key_cond = key_cond & Key("GSI2SK").begins_with(sk_begins_with)
        params: dict = {
            "IndexName": "GSI2-Custom",
            "KeyConditionExpression": key_cond,
        }
        if limit:
            params["Limit"] = limit
        return _table.query(**params).get("Items", [])
