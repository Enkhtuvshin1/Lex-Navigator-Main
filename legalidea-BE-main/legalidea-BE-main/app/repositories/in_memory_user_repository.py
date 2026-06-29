"""In-memory user repository suitable for early auth experiments."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import UUID, uuid4


@dataclass
class InMemoryUser:
    id: UUID
    email: str
    full_name: str | None
    hashed_password: str
    is_active: bool = True
    role: str = "user"
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class InMemoryUserRepository:
    def __init__(self) -> None:
        self._users: dict[str, InMemoryUser] = {}
        self._lock = asyncio.Lock()

    async def list(self) -> list[InMemoryUser]:
        return list(self._users.values())

    async def get_by_email(self, email: str) -> InMemoryUser | None:
        return self._users.get(email.lower())

    async def get_by_id(self, user_id: UUID | str) -> InMemoryUser | None:
        lookup_id = user_id
        if isinstance(user_id, str):
            try:
                lookup_id = UUID(user_id)
            except ValueError:
                return None
        return next((user for user in self._users.values() if user.id == lookup_id), None)

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
    ) -> InMemoryUser:
        normalized_email = email.lower()
        async with self._lock:
            user = InMemoryUser(
                id=uuid4(),
                email=normalized_email,
                full_name=full_name,
                hashed_password=hashed_password,
                role=role,
                bar_number=bar_number,
                specialization=specialization,
                law_firm=law_firm,
                created_at=datetime.now(timezone.utc),
            )
            self._users[normalized_email] = user
            return user

    async def update_fields(self, user: InMemoryUser, fields: dict[str, object]) -> InMemoryUser:
        old_email = user.email.lower()
        for key, value in fields.items():
            setattr(user, key, value)

        if user.email.lower() != old_email:
            self._users.pop(old_email, None)
            self._users[user.email.lower()] = user

        return user


in_memory_user_repository = InMemoryUserRepository()
