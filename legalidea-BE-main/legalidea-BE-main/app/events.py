"""Application lifecycle hooks."""
from collections.abc import AsyncIterator

from fastapi import FastAPI


async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Centralized lifespan handler wired into FastAPI."""
    await on_startup(app)
    yield
    await on_shutdown(app)


async def on_startup(app: FastAPI) -> None:
    """Initialize resources (DB, cache, etc.)."""
    # Placeholder for DB warm-up or cache priming when needed.
    app.state.health = "ok"


async def on_shutdown(app: FastAPI) -> None:
    """Release resources before process exit."""
    # Add graceful shutdown logic (close DB pools, flush metrics, etc.).
    pass
