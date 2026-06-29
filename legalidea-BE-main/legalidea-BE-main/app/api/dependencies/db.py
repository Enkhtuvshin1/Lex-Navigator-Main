"""Database-related dependencies injected into routes."""
from collections.abc import AsyncIterator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.case_repository import CaseRepository
from app.db.repositories.law_repository import LawRepository
from app.db.repositories.message_repository import MessageRepository
from app.db.repositories.user_repository import UserRepository
from app.db.session import async_session
from app.services.ai_service import AIService
from app.services.chat_service import ChatService
from app.services.user_service import UserService


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        yield session


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> UserRepository:
    return UserRepository(session)


def get_user_service(
    repository: UserRepository = Depends(get_user_repository),
) -> UserService:
    return UserService(repository)


def get_case_repository(
    session: AsyncSession = Depends(get_db_session),
) -> CaseRepository:
    return CaseRepository(session)


def get_message_repository(
    session: AsyncSession = Depends(get_db_session),
) -> MessageRepository:
    return MessageRepository(session)


def get_law_repository(
    session: AsyncSession = Depends(get_db_session),
) -> LawRepository:
    return LawRepository(session)


def get_chat_service(
    case_repo: CaseRepository = Depends(get_case_repository),
    message_repo: MessageRepository = Depends(get_message_repository),
    law_repo: LawRepository = Depends(get_law_repository),
) -> ChatService:
    return ChatService(
        case_repo=case_repo,
        message_repo=message_repo,
        law_repo=law_repo,
        ai_service=AIService(),
    )
