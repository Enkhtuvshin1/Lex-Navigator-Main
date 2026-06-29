"""Health and readiness probes."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Liveness probe")
async def get_health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readiness", summary="Readiness probe")
async def get_readiness() -> dict[str, str]:
    # Extend with DB/cache pings when those pieces are wired up.
    return {"status": "ready"}
