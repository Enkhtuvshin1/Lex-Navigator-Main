"""User profile endpoints."""
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.db import get_user_repository
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import ProfileUpdate, UserPublic

router = APIRouter()


@router.get("/me", response_model=UserPublic)
async def get_profile(
    current_user: UserPublic = Depends(get_current_user),
) -> UserPublic:
    return current_user


@router.put("/me", response_model=UserPublic)
async def update_profile(
    payload: ProfileUpdate,
    current_user: UserPublic = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
) -> UserPublic:
    user = await repo.get_by_id(current_user.id)
    updated = await repo.update(
        user,
        full_name=payload.full_name,
        bar_number=payload.bar_number,
        specialization=payload.specialization,
        law_firm=payload.law_firm,
    )
    return UserPublic.model_validate(updated)
