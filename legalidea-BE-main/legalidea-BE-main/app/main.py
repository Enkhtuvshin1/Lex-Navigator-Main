"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.events import lifespan
from app.version import APP_NAME, APP_VERSION


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.debug)

    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        debug=settings.debug,
        lifespan=lifespan,
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
    )

    allowed_origins = settings.cors_origins or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    # Log configured API prefix and all mounted routes for runtime debugging
    import logging

    logger = logging.getLogger("uvicorn")
    logger.info("Configured API_PREFIX=%s", settings.api_prefix)
    for r in app.routes:
        methods = getattr(r, "methods", None)
        logger.info("Mounted route: %s methods=%s", getattr(r, "path", r), methods)
    # Also print to stdout so platform logs reliably capture this at startup
    try:
        print(f"Configured API_PREFIX={settings.api_prefix}")
        for r in app.routes:
            methods = getattr(r, "methods", None)
            print(f"Mounted route: {getattr(r, 'path', r)} methods={methods}")
    except Exception:
        pass

    @app.get("/", tags=["meta"], summary="Service metadata")
    async def root() -> dict[str, str]:
        return {"name": APP_NAME, "version": APP_VERSION}

    return app


app = create_app()
