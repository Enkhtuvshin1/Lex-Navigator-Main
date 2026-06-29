"""Law repository."""
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.law import LawArticle, LawCategory


class LawRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_categories(self) -> list[LawCategory]:
        result = await self.session.execute(select(LawCategory).order_by(LawCategory.name))
        return list(result.scalars())

    async def get_category(self, category_id: int) -> LawCategory | None:
        return await self.session.get(LawCategory, category_id)

    async def list_articles_by_category(self, category_id: int) -> list[LawArticle]:
        result = await self.session.execute(
            select(LawArticle)
            .where(LawArticle.category_id == category_id)
            .order_by(LawArticle.number)
        )
        return list(result.scalars())

    async def get_article(self, article_id: int) -> LawArticle | None:
        return await self.session.get(LawArticle, article_id)

    async def search(self, query: str, limit: int = 20) -> list[LawArticle]:
        term = f"%{query}%"
        result = await self.session.execute(
            select(LawArticle)
            .where(
                or_(
                    LawArticle.title.ilike(term),
                    LawArticle.content.ilike(term),
                    LawArticle.number.ilike(term),
                )
            )
            .limit(limit)
        )
        return list(result.scalars())

    async def get_articles_by_ids(self, article_ids: list[int]) -> list[LawArticle]:
        if not article_ids:
            return []
        result = await self.session.execute(
            select(LawArticle).where(LawArticle.id.in_(article_ids))
        )
        return list(result.scalars())

    async def create_category(self, *, name: str, description: str | None) -> LawCategory:
        category = LawCategory(name=name, description=description)
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def delete_category(self, category: LawCategory) -> None:
        await self.session.delete(category)
        await self.session.commit()

    async def create_article(
        self, *, category_id: int, number: str, title: str, content: str
    ) -> LawArticle:
        article = LawArticle(category_id=category_id, number=number, title=title, content=content)
        self.session.add(article)
        await self.session.commit()
        await self.session.refresh(article)
        return article

    async def update_article(
        self, article: LawArticle, *, number: str, title: str, content: str
    ) -> LawArticle:
        article.number = number
        article.title = title
        article.content = content
        await self.session.commit()
        await self.session.refresh(article)
        return article

    async def delete_article(self, article: LawArticle) -> None:
        await self.session.delete(article)
        await self.session.commit()
