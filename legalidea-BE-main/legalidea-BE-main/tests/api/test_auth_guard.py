import uuid

import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from app.api.dependencies.db import get_user_repository
from app.repositories.in_memory_user_repository import InMemoryUserRepository


@pytest.fixture()
def in_memory_user_repository() -> InMemoryUserRepository:
    return InMemoryUserRepository()


@pytest.fixture(autouse=True)
def override_user_repository(
    app: FastAPI, in_memory_user_repository: InMemoryUserRepository
) -> None:
    app.dependency_overrides[get_user_repository] = lambda: in_memory_user_repository
    yield
    app.dependency_overrides.pop(get_user_repository, None)


@pytest.mark.asyncio
async def test_users_route_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/users/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_users_route_accepts_valid_token(client: AsyncClient) -> None:
    unique_email = f"user-{uuid.uuid4()}@example.com"
    register_payload = {
        "email": unique_email,
        "password": "ValidPass123!",
        "full_name": "Protected User",
    }

    register_response = await client.post("/api/auth/register", json=register_payload)
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    response = await client.get(
        "/api/users/", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    emails = [user["email"] for user in response.json()]
    assert unique_email in emails


@pytest.mark.asyncio
async def test_invalid_token_is_rejected(client: AsyncClient) -> None:
    response = await client.get(
        "/api/users/", headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"
