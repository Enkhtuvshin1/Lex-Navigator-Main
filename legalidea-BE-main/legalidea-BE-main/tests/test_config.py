from app.core.config import Settings


def test_api_prefix_gets_leading_slash() -> None:
    settings = Settings(api_prefix="api")

    assert settings.api_prefix == "/api"


def test_cors_origins_from_env_are_parsed(monkeypatch) -> None:
    monkeypatch.setenv("ORIGINS", "https://example.com")

    settings = Settings()

    assert settings.cors_origins == ["https://example.com"]
