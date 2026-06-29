"""User domain logic."""
from app.core.security import get_password_hash
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserPublic


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    async def list_users(self) -> list[UserPublic]:
        users = await self.repository.list()
        return [UserPublic.model_validate(user) for user in users]

    async def get_user_by_email(self, email: str) -> UserPublic | None:
        user = await self.repository.get_by_email(email)
        if not user:
            return None
        return UserPublic.model_validate(user)

    async def create_user(self, payload: UserCreate) -> UserPublic:
        hashed_password = get_password_hash(payload.password)
        user = await self.repository.create(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hashed_password,
        )
        return UserPublic.model_validate(user)
