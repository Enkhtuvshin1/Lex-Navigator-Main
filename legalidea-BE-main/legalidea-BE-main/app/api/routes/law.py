"""Law database endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.db import get_law_repository
from app.db.repositories.law_repository import LawRepository
from app.schemas.law import LawArticlePublic, LawArticleSummary, LawCategoryPublic
from app.schemas.user import UserPublic

router = APIRouter()


@router.get("/categories", response_model=list[LawCategoryPublic])
async def list_categories(
    _current_user: UserPublic = Depends(get_current_user),
    repo: LawRepository = Depends(get_law_repository),
) -> list[LawCategoryPublic]:
    categories = await repo.list_categories()
    return [LawCategoryPublic.model_validate(c) for c in categories]


@router.get("/categories/{category_id}/articles", response_model=list[LawArticleSummary])
async def list_articles(
    category_id: int,
    _current_user: UserPublic = Depends(get_current_user),
    repo: LawRepository = Depends(get_law_repository),
) -> list[LawArticleSummary]:
    category = await repo.get_category(category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    articles = await repo.list_articles_by_category(category_id)
    return [LawArticleSummary.model_validate(a) for a in articles]


@router.get("/articles/{article_id}", response_model=LawArticlePublic)
async def get_article(
    article_id: int,
    _current_user: UserPublic = Depends(get_current_user),
    repo: LawRepository = Depends(get_law_repository),
) -> LawArticlePublic:
    article = await repo.get_article(article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return LawArticlePublic.model_validate(article)


@router.get("/search", response_model=list[LawArticleSummary])
async def search_law(
    query: str = Query(..., min_length=1),
    _current_user: UserPublic = Depends(get_current_user),
    repo: LawRepository = Depends(get_law_repository),
) -> list[LawArticleSummary]:
    articles = await repo.search(query)
    return [LawArticleSummary.model_validate(a) for a in articles]
