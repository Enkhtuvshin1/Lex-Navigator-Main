"""User-facing endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.db import get_user_service
from app.schemas.user import UserCreate, UserPublic
from app.services.user_service import UserService

router = APIRouter()


@router.get("/", response_model=list[UserPublic])
async def list_users(
    service: UserService = Depends(get_user_service),
    _current_user: UserPublic = Depends(get_current_user),
) -> list[UserPublic]:
    return await service.list_users()


@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    service: UserService = Depends(get_user_service),
    _current_user: UserPublic = Depends(get_current_user),
) -> UserPublic:
    exists = await service.get_user_by_email(payload.email)
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already used")
    return await service.create_user(payload)
