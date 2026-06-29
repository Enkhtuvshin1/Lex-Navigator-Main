"""Admin-only endpoints for user account management."""
from datetime import datetime
from secrets import compare_digest
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from app.api.dependencies.db import get_case_repository, get_law_repository, get_user_repository
from app.core.config import Settings, get_settings
from app.core.security import TokenDecodeError, create_admin_access_token, decode_access_token
from app.db.repositories.case_repository import CaseRepository
from app.db.repositories.law_repository import LawRepository
from app.db.repositories.user_repository import UserRepository
from app.schemas.auth import AdminAuthResponse, AdminLoginRequest
from app.schemas.law import (
    LawArticleCreate,
    LawArticlePublic,
    LawArticleUpdate,
    LawCategoryCreate,
    LawCategoryPublic,
)
from app.schemas.user import AdminUserUpdate, UserPublic


class CaseAdminItem(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

router = APIRouter()
admin_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")


async def require_admin(
    token: str = Depends(admin_oauth2_scheme),
    settings: Settings = Depends(get_settings),
) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except TokenDecodeError:
        raise credentials_exception

    if payload.get("scope") != "admin" or payload.get("sub") != settings.admin_username:
        raise credentials_exception

    return settings.admin_username


@router.post("/login", response_model=AdminAuthResponse)
async def admin_login(
    payload: AdminLoginRequest,
    settings: Settings = Depends(get_settings),
) -> AdminAuthResponse:
    username_matches = compare_digest(payload.username, settings.admin_username)
    password_matches = compare_digest(payload.password, settings.admin_password)
    if not username_matches or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin username or password",
        )

    token = create_admin_access_token(subject=settings.admin_username)
    return AdminAuthResponse(access_token=token, username=settings.admin_username)


@router.get("/users", response_model=list[UserPublic])
async def list_admin_users(
    _admin: str = Depends(require_admin),
    repo: UserRepository = Depends(get_user_repository),
) -> list[UserPublic]:
    users = await repo.list()
    return [UserPublic.model_validate(user) for user in users]


@router.patch("/users/{user_id}", response_model=UserPublic)
async def update_admin_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    _admin: str = Depends(require_admin),
    repo: UserRepository = Depends(get_user_repository),
) -> UserPublic:
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    fields = payload.model_dump(exclude_unset=True)
    if "email" in fields:
        existing = await repo.get_by_email(str(fields["email"]))
        if existing is not None and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already used")

    updated = await repo.update_fields(user, fields)
    return UserPublic.model_validate(updated)


# ── Cases ────────────────────────────────────────────────────────────────────

@router.get("/cases", response_model=list[CaseAdminItem])
async def list_all_cases(
    _admin: str = Depends(require_admin),
    repo: CaseRepository = Depends(get_case_repository),
) -> list[CaseAdminItem]:
    cases = await repo.list_all()
    return [CaseAdminItem.model_validate(c) for c in cases]


@router.delete("/cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: UUID,
    _admin: str = Depends(require_admin),
    repo: CaseRepository = Depends(get_case_repository),
) -> None:
    case = await repo.get_by_id(case_id)
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    await repo.delete(case)


# ── Laws ─────────────────────────────────────────────────────────────────────

@router.get("/law/categories", response_model=list[LawCategoryPublic])
async def admin_list_categories(
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> list[LawCategoryPublic]:
    categories = await repo.list_categories()
    return [LawCategoryPublic.model_validate(c) for c in categories]


@router.get("/law/categories/{category_id}/articles", response_model=list[LawArticlePublic])
async def admin_list_articles(
    category_id: int,
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> list[LawArticlePublic]:
    category = await repo.get_category(category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    articles = await repo.list_articles_by_category(category_id)
    return [LawArticlePublic.model_validate(a) for a in articles]


@router.post("/law/categories", response_model=LawCategoryPublic, status_code=status.HTTP_201_CREATED)
async def admin_create_category(
    payload: LawCategoryCreate,
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> LawCategoryPublic:
    category = await repo.create_category(name=payload.name, description=payload.description)
    return LawCategoryPublic.model_validate(category)


@router.delete("/law/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_category(
    category_id: int,
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> None:
    category = await repo.get_category(category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await repo.delete_category(category)


@router.post("/law/articles", response_model=LawArticlePublic, status_code=status.HTTP_201_CREATED)
async def admin_create_article(
    payload: LawArticleCreate,
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> LawArticlePublic:
    category = await repo.get_category(payload.category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    article = await repo.create_article(
        category_id=payload.category_id,
        number=payload.number,
        title=payload.title,
        content=payload.content,
    )
    return LawArticlePublic.model_validate(article)


@router.put("/law/articles/{article_id}", response_model=LawArticlePublic)
async def admin_update_article(
    article_id: int,
    payload: LawArticleUpdate,
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> LawArticlePublic:
    article = await repo.get_article(article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    updated = await repo.update_article(
        article, number=payload.number, title=payload.title, content=payload.content
    )
    return LawArticlePublic.model_validate(updated)


@router.delete("/law/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_article(
    article_id: int,
    _admin: str = Depends(require_admin),
    repo: LawRepository = Depends(get_law_repository),
) -> None:
    article = await repo.get_article(article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    await repo.delete_article(article)
