"""Application configuration driven by environment variables."""
from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always resolve .env relative to the project root, regardless of working directory
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    app_name: str = "LegalIdea API"
    environment: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="APP_DEBUG")
    api_prefix: str = Field(default="/api", alias="API_PREFIX")

    database_url: str = Field(
        default="sqlite+aiosqlite:///./dev.db",
        alias="DATABASE_URL",
        description="Fallback SQLite store so auth can run without external DB",
    )
    sync_database_url: str = Field(
        default="sqlite:///./dev.db",
        alias="SYNC_DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    admin_username: str = Field(default="SuperAdmin", alias="ADMIN_USERNAME")
    admin_password: str = Field(default="5005430411Addjs", alias="ADMIN_PASSWORD")

    cors_origins: list[str] = Field(default_factory=list, alias="ORIGINS")

    ai_api_key: str = Field(default="", alias="AI_API_KEY")
    ai_api_url: str = Field(default="https://api.openai.com/v1", alias="AI_API_URL")
    ai_model: str = Field(default="gpt-4o-mini", alias="AI_MODEL")

    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Cache settings object for reuse across the app lifecycle."""
    return Settings()  # type: ignore[arg-type]
