"""Case repository."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.case import Case


class CaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_by_user(self, user_id: UUID) -> list[Case]:
        result = await self.session.execute(
            select(Case).where(Case.user_id == user_id).order_by(Case.created_at.desc())
        )
        return list(result.scalars())

    async def get_by_id(self, case_id: UUID) -> Case | None:
        return await self.session.get(Case, case_id)

    async def list_all(self) -> list[Case]:
        result = await self.session.execute(
            select(Case).order_by(Case.created_at.desc())
        )
        return list(result.scalars())

    async def delete(self, case: Case) -> None:
        await self.session.delete(case)
        await self.session.commit()

    async def update_title(self, case: Case, title: str | None) -> Case:
        case.title = title
        await self.session.commit()
        await self.session.refresh(case)
        return case

    async def create(self, *, user_id: UUID, title: str | None) -> Case:
        case = Case(user_id=user_id, title=title)
        self.session.add(case)
        await self.session.commit()
        await self.session.refresh(case)
        return case
