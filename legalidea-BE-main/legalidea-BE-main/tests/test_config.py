from app.core.config import Settings


def test_api_prefix_gets_leading_slash() -> None:
    settings = Settings(api_prefix="api")

    assert settings.api_prefix == "/api"
