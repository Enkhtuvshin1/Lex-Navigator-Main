"""Base API router wiring feature routers together."""
from fastapi import APIRouter

from app.api.routes import admin, auth, chat, health, law, profile, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(law.router, prefix="/law", tags=["law"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
