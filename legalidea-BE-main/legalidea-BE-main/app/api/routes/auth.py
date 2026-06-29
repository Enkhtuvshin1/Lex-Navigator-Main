"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies.auth import get_auth_service
from app.schemas.auth import AuthResponse, LoginRequest
from app.schemas.user import UserCreate
from app.services.auth_service import AuthService, InvalidCredentials, UserAlreadyExists

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate, service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    try:
        user, token = await service.register_user(payload)
    except UserAlreadyExists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already used")
    return AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest, service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    try:
        user, token = await service.login(email=payload.email, password=payload.password)
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return AuthResponse(access_token=token, user=user)
