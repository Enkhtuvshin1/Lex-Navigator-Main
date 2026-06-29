"""Message repository."""
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.message import Message


class MessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_by_case(self, case_id: UUID) -> list[Message]:
        result = await self.session.execute(
            select(Message).where(Message.case_id == case_id).order_by(Message.created_at)
        )
        return list(result.scalars())

    async def create(
        self,
        *,
        case_id: UUID,
        role: str,
        content: str,
        law_references: list[int] | None = None,
    ) -> Message:
        msg = Message(
            case_id=case_id,
            role=role,
            content=content,
            law_references=json.dumps(law_references or []),
        )
        self.session.add(msg)
        await self.session.commit()
        await self.session.refresh(msg)
        return msg
