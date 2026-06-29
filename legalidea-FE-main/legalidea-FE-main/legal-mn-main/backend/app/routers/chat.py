from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import (
    CaseCreate,
    CaseOut,
    ChatMessageRequest,
    LawRef,
    MessageOut,
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=list[CaseOut])
async def get_case_history():
    """Return the current user's conversation list."""
    # TODO: fetch from DB filtered by authenticated user
    return [
        CaseOut(
            id="1",
            user_id="placeholder-uuid",
            title="Үл хөдлөх хөрөнгийн маргаан – Улаанбаатар",
            status="open",
            created_at=datetime(2026, 3, 15, tzinfo=timezone.utc),
        ),
        CaseOut(
            id="2",
            user_id="placeholder-uuid",
            title="Хөдөлмөрийн гэрээ цуцлалт",
            status="open",
            created_at=datetime(2026, 3, 14, tzinfo=timezone.utc),
        ),
        CaseOut(
            id="3",
            user_id="placeholder-uuid",
            title="Гэрээний зөрчлийн дүн шинжилгээ",
            status="open",
            created_at=datetime(2026, 3, 12, tzinfo=timezone.utc),
        ),
    ]


@router.post("/cases", response_model=CaseOut)
async def create_case(body: CaseCreate):
    """Start a new conversation / case."""
    # TODO: insert into DB, assign to authenticated user
    return CaseOut(
        id="new-placeholder-uuid",
        user_id="placeholder-uuid",
        title=body.title,
        status="open",
        created_at=datetime.now(timezone.utc),
    )


@router.get("/cases/{case_id}/messages", response_model=list[MessageOut])
async def get_case_messages(case_id: str):
    """Load all messages for a specific case."""
    # TODO: fetch messages from DB by case_id
    return [
        MessageOut(
            id="welcome",
            case_id=case_id,
            role="assistant",
            content="Хуулийн Оюун AI-д тавтай морил. Эрх зүйн нөхцөл байдлаа тайлбарлана уу.",
            law_references=[],
            created_at=datetime.now(timezone.utc),
        ),
    ]


@router.post("/message", response_model=MessageOut)
async def send_message(body: ChatMessageRequest):
    """Send a user message and get AI legal analysis back."""
    # TODO: save user message to DB
    # TODO: call AI model for legal analysis
    # TODO: find relevant law references
    # TODO: save assistant message to DB
    return MessageOut(
        id="placeholder-msg-id",
        case_id=body.case_id,
        role="assistant",
        content=(
            "Таны тайлбарт үндэслэн, энэ нь Монгол Улсын Иргэний хуулийн "
            "228-232 зүйлийн хохирлоос үүсэх үүргийн заалтуудтай холбоотой байна.\n\n"
            "**Гол дүн шинжилгээ:**\n\n"
            "1. **Хамаарах хууль:** Иргэний хууль\n"
            "2. **Холбогдох зүйл заалтууд:** 228, 232 зүйл\n"
            "3. **Зөвлөмж:** Мэргэжлийн өмгөөлөгчтэй зөвлөлдөнө үү."
        ),
        law_references=[
            LawRef(id=1, number="228", title="Хохирлоос үүсэх үүрэг"),
            LawRef(id=2, number="232", title="Сэтгэл санааны хохирлын нөхөн төлбөр"),
        ],
        created_at=datetime.now(timezone.utc),
    )
