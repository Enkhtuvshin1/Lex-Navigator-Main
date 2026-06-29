from fastapi import APIRouter

from app.schemas import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileOut)
async def get_my_profile():
    """Return the authenticated user's profile."""
    # TODO: get user_id from auth token, fetch from DB
    return ProfileOut(
        id="placeholder-uuid",
        email="user@example.com",
        full_name="Placeholder Нэр",
        role="user",
    )


@router.put("/me", response_model=ProfileOut)
async def update_my_profile(body: ProfileUpdate):
    """Update the authenticated user's profile."""
    # TODO: get user_id from auth token, update in DB
    return ProfileOut(
        id="placeholder-uuid",
        email="user@example.com",
        full_name=body.full_name or "Placeholder Нэр",
        role="lawyer",
        specialty=body.specialty,
        license_number=body.license_number,
        years_of_experience=body.years_of_experience,
    )
