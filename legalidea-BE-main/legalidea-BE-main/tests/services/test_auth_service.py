import uuid
from datetime import datetime, timezone

import pytest

from app.schemas.user import UserCreate
from app.services.auth_service import AuthService, InvalidCredentials, UserAlreadyExists


class FakeUser:
    def __init__(
        self, *, user_id: uuid.UUID, email: str, full_name: str | None, hashed_password: str
    ) -> None:
        self.id = user_id
        self.email = email
        self.full_name = full_name
        self.hashed_password = hashed_password
        self.is_active = True
        self.role = "user"
        self.bar_number = None
        self.specialization = None
        self.law_firm = None
        self.created_at = datetime.now(timezone.utc)


class FakeUserRepository:
    def __init__(self) -> None:
        self._users: list[FakeUser] = []

    async def get_by_email(self, email: str) -> FakeUser | None:
        return next((user for user in self._users if user.email == email), None)

    async def create(
        self,
        *,
        email: str,
        full_name: str | None,
        hashed_password: str,
        role: str = "user",
        bar_number: str | None = None,
        specialization: str | None = None,
        law_firm: str | None = None,
    ) -> FakeUser:
        user = FakeUser(
            user_id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
        )
        self._users.append(user)
        return user


@pytest.mark.asyncio
async def test_register_user_returns_token() -> None:
    repo = FakeUserRepository()
    service = AuthService(repo)

    payload = UserCreate(email="new@example.com", password="super-secret", full_name="New User")
    user, token = await service.register_user(payload)

    assert user.email == payload.email
    assert token

    with pytest.raises(UserAlreadyExists):
        await service.register_user(payload)


@pytest.mark.asyncio
async def test_login_validates_password() -> None:
    repo = FakeUserRepository()
    service = AuthService(repo)
    payload = UserCreate(email="login@example.com", password="correct", full_name=None)
    await service.register_user(payload)

    user, token = await service.login(email="login@example.com", password="correct")
    assert user.email == payload.email
    assert token

    with pytest.raises(InvalidCredentials):
        await service.login(email="login@example.com", password="wrong")
