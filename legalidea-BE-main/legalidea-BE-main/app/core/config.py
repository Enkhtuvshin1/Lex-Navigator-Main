"""Application configuration driven by environment variables."""
import json
from functools import lru_cache
from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings.sources import EnvSettingsSource

# Always resolve .env relative to the project root, regardless of working directory
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"


def parse_cors_origins(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, tuple):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("[") and text.endswith("]"):
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                parsed = []
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        if "," in text:
            return [item.strip() for item in text.split(",") if item.strip()]
        return [text]
    return value


class CustomEnvSettingsSource(EnvSettingsSource):
    def prepare_field_value(self, field_name, field, field_value, value_is_complex):
        if field_name == "cors_origins":
            return parse_cors_origins(field_value)
        return super().prepare_field_value(field_name, field, field_value, value_is_complex)


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

    @classmethod
    def settings_customise_sources(cls, _settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings):
        return (
            init_settings,
            CustomEnvSettingsSource(_settings_cls),
            dotenv_settings,
            file_secret_settings,
        )

    @field_validator("api_prefix", mode="before")
    @classmethod
    def ensure_leading_slash(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        value = value.strip()
        if not value:
            return "/"
        return value if value.startswith("/") else f"/{value}"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins_field(cls, value):
        return parse_cors_origins(value)


@lru_cache
def get_settings() -> Settings:
    """Cache settings object for reuse across the app lifecycle."""
    try:
        return Settings()  # type: ignore[arg-type]
    except Exception:
        return Settings(cors_origins=[])  # type: ignore[arg-type]
