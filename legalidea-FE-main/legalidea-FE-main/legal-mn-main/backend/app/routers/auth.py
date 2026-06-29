from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import AuthResponse, LoginRequest, RegisterRequest, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    """Register a new user or lawyer account."""
    # TODO: create user in Supabase / DB, hash password, issue real JWT
    user = UserPublic(
        id="placeholder-uuid",
        email=body.email,
        full_name=body.full_name,
        role=body.role,
        bar_number=body.bar_number,
        specialization=body.specialization,
        law_firm=body.law_firm,
        created_at=datetime.now(timezone.utc),
    )
    return AuthResponse(access_token="placeholder-token", user=user)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Authenticate a user and return a JWT."""
    # TODO: verify password against DB, issue real JWT
    user = UserPublic(
        id="placeholder-uuid",
        email=body.email,
        full_name="Placeholder Нэр",
        role="user",
        created_at=datetime.now(timezone.utc),
    )
    return AuthResponse(access_token="placeholder-token", user=user)
