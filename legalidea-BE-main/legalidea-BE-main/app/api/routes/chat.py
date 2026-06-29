"""Chat and case endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.db import get_chat_service
from app.schemas.chat import CaseCreate, CasePublic, MessagePublic, MessageSend
from app.schemas.user import UserPublic
from app.services.chat_service import CaseNotFound, ChatService

router = APIRouter()


@router.get("/history", response_model=list[CasePublic])
async def get_history(
    current_user: UserPublic = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> list[CasePublic]:
    return await service.list_cases(current_user.id)


@router.post("/cases", response_model=CasePublic, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreate,
    current_user: UserPublic = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> CasePublic:
    return await service.create_case(current_user.id, payload.title)


@router.get("/cases/{case_id}/messages", response_model=list[MessagePublic])
async def get_messages(
    case_id: UUID,
    current_user: UserPublic = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> list[MessagePublic]:
    try:
        return await service.get_messages(case_id, current_user.id)
    except CaseNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")


@router.patch("/cases/{case_id}", response_model=CasePublic)
async def rename_case(
    case_id: UUID,
    payload: CaseCreate,
    current_user: UserPublic = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> CasePublic:
    case = await service.case_repo.get_by_id(case_id)
    if case is None or case.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    updated = await service.case_repo.update_title(case, payload.title)
    return CasePublic.model_validate(updated)


@router.delete("/cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: UUID,
    current_user: UserPublic = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> None:
    case = await service.case_repo.get_by_id(case_id)
    if case is None or case.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    await service.case_repo.delete(case)


@router.post("/message", response_model=MessagePublic, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageSend,
    current_user: UserPublic = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> MessagePublic:
    try:
        return await service.send_message(payload.case_id, current_user.id, payload.content)
    except CaseNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
