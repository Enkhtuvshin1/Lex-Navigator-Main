"""Dependencies for auth flows backed by the real database."""
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.api.dependencies.db import get_user_repository
from app.core.security import TokenDecodeError, decode_access_token
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import UserPublic
from app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_auth_service(repository: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(repository)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    repository: UserRepository = Depends(get_user_repository),
) -> UserPublic:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except TokenDecodeError:
        raise credentials_exception

    subject = payload.get("sub")
    if subject is None:
        raise credentials_exception

    try:
        user_id = UUID(str(subject))
    except ValueError:
        raise credentials_exception

    user = await repository.get_by_id(user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    return UserPublic.model_validate(user)
