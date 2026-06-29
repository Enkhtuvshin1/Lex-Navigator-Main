"""Chat / case service."""
from __future__ import annotations

import json
from uuid import UUID

from app.db.repositories.case_repository import CaseRepository
from app.db.repositories.law_repository import LawRepository
from app.db.repositories.message_repository import MessageRepository
from app.schemas.chat import CasePublic, LawRef, MessagePublic
from app.services.ai_service import AIService
from app.services.case_search import search_cases


class CaseNotFound(Exception):
    pass


class ChatService:
    def __init__(
        self,
        case_repo: CaseRepository,
        message_repo: MessageRepository,
        law_repo: LawRepository,
        ai_service: AIService,
    ) -> None:
        self.case_repo = case_repo
        self.message_repo = message_repo
        self.law_repo = law_repo
        self.ai_service = ai_service

    async def list_cases(self, user_id: UUID) -> list[CasePublic]:
        cases = await self.case_repo.list_by_user(user_id)
        return [CasePublic.model_validate(c) for c in cases]

    async def create_case(self, user_id: UUID, title: str | None) -> CasePublic:
        case = await self.case_repo.create(user_id=user_id, title=title)
        return CasePublic.model_validate(case)

    async def get_messages(self, case_id: UUID, user_id: UUID) -> list[MessagePublic]:
        case = await self.case_repo.get_by_id(case_id)
        if case is None or case.user_id != user_id:
            raise CaseNotFound
        messages = await self.message_repo.list_by_case(case_id)
        return [self._to_message_public(m) for m in messages]

    async def send_message(
        self, case_id: UUID, user_id: UUID, content: str
    ) -> MessagePublic:
        case = await self.case_repo.get_by_id(case_id)
        if case is None or case.user_id != user_id:
            raise CaseNotFound

        # Load conversation history (last 10 messages for context window)
        prev_messages = await self.message_repo.list_by_case(case_id)
        history = [
            {"role": m.role, "content": m.content}
            for m in prev_messages[-10:]
        ]

        # Persist user message
        await self.message_repo.create(case_id=case_id, role="user", content=content)

        # Find relevant law articles by keyword search
        related_articles = await self.law_repo.search(content, limit=5)
        article_ids = [a.id for a in related_articles]

        # Build context for AI
        law_context = "\n\n".join(
            f"Зүйл {a.number}: {a.title}\n{a.content[:500]}" for a in related_articles
        )

        # Find relevant court cases from downloaded files
        related_cases = search_cases(content, limit=3)
        case_context = "\n\n".join(
            f"Шүүхийн шийдвэр #{c['id']}:\n{c['text'][:800]}"
            for c in related_cases
        )

        # Combine law articles + court cases as context
        full_context = law_context
        if case_context:
            full_context += "\n\nХолбогдох шүүхийн шийдвэрүүд:\n" + case_context

        # Get AI response with conversation history
        ai_text = await self.ai_service.get_response(content, full_context, history=history)

        # Persist assistant message with law references
        ai_msg = await self.message_repo.create(
            case_id=case_id,
            role="assistant",
            content=ai_text,
            law_references=article_ids,
        )

        return self._to_message_public(ai_msg, related_articles)

    def _to_message_public(self, msg, articles=None) -> MessagePublic:  # type: ignore[no-untyped-def]
        try:
            ref_ids: list[int] = json.loads(msg.law_references or "[]")
        except (ValueError, TypeError):
            ref_ids = []

        if articles is None:
            law_refs = []
        else:
            by_id = {a.id: a for a in articles}
            law_refs = [
                LawRef(id=a.id, number=a.number, title=a.title)
                for rid in ref_ids
                if (a := by_id.get(rid)) is not None
            ]

        return MessagePublic(
            id=msg.id,
            case_id=msg.case_id,
            role=msg.role,
            content=msg.content,
            law_references=law_refs,
            created_at=msg.created_at,
        )
