"""Unit tests for BaseRepository using moto DynamoDB mock."""
from __future__ import annotations

import os

import boto3
import pytest

os.environ.setdefault("TABLE_NAME", "node-main-test")
os.environ.setdefault("AWS_DEFAULT_REGION", "ap-northeast-2")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")


@pytest.fixture()
def dynamodb_table():
    from moto import mock_aws

    with mock_aws():
        client = boto3.client("dynamodb", region_name="ap-northeast-2")
        client.create_table(
            TableName="node-main-test",
            BillingMode="PAY_PER_REQUEST",
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
                {"AttributeName": "GSI2PK", "AttributeType": "S"},
                {"AttributeName": "GSI2SK", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1-TypeDate",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "GSI2-Custom",
                    "KeySchema": [
                        {"AttributeName": "GSI2PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI2SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
        )
        yield


def test_put_and_get(dynamodb_table):
    from repositories.base_repo import BaseRepository

    repo = BaseRepository("TASK")
    item = repo.put("user1", {"title": "test task", "sort_key": "todo#2026-07-10"})

    assert item["id"]
    assert item["PK"] == "USER#user1"
    assert item["SK"].startswith("TASK#")
    assert item["title"] == "test task"

    fetched = repo.get("user1", item["id"])
    assert fetched is not None
    assert fetched["title"] == "test task"


def test_update(dynamodb_table):
    from repositories.base_repo import BaseRepository

    repo = BaseRepository("TASK")
    item = repo.put("user1", {"title": "original"})
    repo.update("user1", item["id"], {"title": "updated"})
    fetched = repo.get("user1", item["id"])
    assert fetched["title"] == "updated"


def test_delete(dynamodb_table):
    from repositories.base_repo import BaseRepository

    repo = BaseRepository("TASK")
    item = repo.put("user1", {"title": "to delete"})
    repo.delete("user1", item["id"])
    assert repo.get("user1", item["id"]) is None


def test_query_by_user(dynamodb_table):
    from repositories.base_repo import BaseRepository

    repo = BaseRepository("TASK")
    repo.put("user1", {"title": "task 1"})
    repo.put("user1", {"title": "task 2"})
    repo.put("user2", {"title": "other user"})

    items = repo.query_by_user("user1")
    assert len(items) == 2
    titles = {i["title"] for i in items}
    assert titles == {"task 1", "task 2"}
