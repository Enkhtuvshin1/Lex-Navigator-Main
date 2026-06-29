"""User repository encapsulating DB operations."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self) -> list[User]:
        result = await self.session.execute(select(User))
        return list(result.scalars())

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID | str) -> User | None:
        lookup_id = user_id
        if isinstance(user_id, str):
            try:
                lookup_id = UUID(user_id)
            except ValueError:
                return None
        return await self.session.get(User, lookup_id)

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
    ) -> User:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            role=role,
            bar_number=bar_number,
            specialization=specialization,
            law_firm=law_firm,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update(self, user: User, **fields: object) -> User:
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_fields(self, user: User, fields: dict[str, object]) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        await self.session.commit()
        await self.session.refresh(user)
        return user
