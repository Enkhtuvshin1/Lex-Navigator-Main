from fastapi import APIRouter

from app.schemas import LawArticle, LawArticleDetail, LawCategory, LawSearchResult

router = APIRouter(prefix="/law", tags=["law"])


@router.get("/categories", response_model=list[LawCategory])
async def get_categories():
    """Return all top-level law categories."""
    # TODO: fetch from DB
    return [
        LawCategory(
            id="criminal",
            title="Эрүүгийн хууль",
            description="Монгол Улсын Эрүүгийн хуулийн бүлэг, зүйлүүд",
            articles=[
                LawArticle(code="1.1", title="Эрүүгийн хуулийн зорилт"),
                LawArticle(code="2.1", title="Гэмт хэргийн ойлголт"),
            ],
        ),
        LawCategory(
            id="civil",
            title="Иргэний хууль",
            description="Монгол Улсын Иргэний хуулийн бүлэг, зүйлүүд",
            articles=[
                LawArticle(code="1.1", title="Иргэний хуулийн зохицуулах харилцаа"),
                LawArticle(code="3.2", title="Гэрээ"),
            ],
        ),
        LawCategory(
            id="administrative",
            title="Захиргааны хууль",
            description="Монгол Улсын Захиргааны хуулийн бүлэг, зүйлүүд",
            articles=[
                LawArticle(code="1.1", title="Хуулийн зорилт, хамрах хүрээ"),
                LawArticle(code="2.1", title="Захиргааны акт"),
            ],
        ),
    ]


@router.get("/categories/{category_id}/articles", response_model=list[LawArticle])
async def get_articles_by_category(category_id: str):
    """Return articles belonging to a law category."""
    # TODO: fetch from DB by category_id
    return [
        LawArticle(code="1.1", title="Placeholder зүйл 1"),
        LawArticle(code="1.2", title="Placeholder зүйл 2"),
    ]


@router.get("/articles/{article_id}", response_model=LawArticleDetail)
async def get_article_detail(article_id: str):
    """Return the full text of a specific law article."""
    # TODO: fetch from DB by article_id
    return LawArticleDetail(
        id=article_id,
        category_id="civil",
        code="228",
        title="Хохирлоос үүсэх үүрэг",
        content="Бусдын биед болон эд хөрөнгөд хууль бусаар хохирол учруулсан этгээд тухайн хохирлыг бүрэн нөхөн төлнө. (Placeholder – бүрэн эх бичвэр энд орно)",
    )


@router.get("/search", response_model=list[LawSearchResult])
async def search_laws(query: str):
    """Full-text search across all law articles."""
    # TODO: implement full-text search in DB
    return [
        LawSearchResult(
            id="placeholder-1",
            code="228",
            title="Хохирлоос үүсэх үүрэг",
            excerpt="...хохирол учруулсан этгээд...",
            category="Иргэний хууль",
        ),
    ]
