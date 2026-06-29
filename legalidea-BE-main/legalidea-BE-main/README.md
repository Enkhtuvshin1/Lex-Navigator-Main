# LegalIdea Backend

FastAPI-based backend service that powers the LegalIdea platform. The project is organized with a clear separation between routing, schemas, database models, and service layers to keep features modular and testable.

## Stack
- FastAPI + Uvicorn for the web layer
- SQLAlchemy + Alembic for persistence
- Pydantic (v2) for data validation and settings management
- Redis or any ASGI-compatible cache for rate limiting and background tasks

## Getting Started
1. **Create and activate a virtual environment** (uv, venv, Poetry, etc.).
2. **Install dependencies**:
   ```bash
   pip install -e .[dev]
   ```
3. **Copy env template**:
   ```bash
   cp .env.example .env
   ```
4. **Run database migrations** (placeholder until Alembic scripts are added):
   ```bash
   alembic upgrade head
   ```
5. **Start the dev server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## Project Layout
```
app/
  api/
    routes/           # Individual routers grouped by feature domain
    dependencies/     # Shared dependencies injected into routes
  core/               # Settings, logging, and application-level utilities
  db/                 # Database session, models, and repositories
  schemas/            # Pydantic models used in the public API
  services/           # Business logic orchestrating repositories and utilities
  main.py             # Application factory
  events.py           # Startup/shutdown hooks

.tests/
  api/                # HTTP-level tests that hit the FastAPI test client
```

## Next Steps
- Add Alembic migration env inside `alembic/`.
- Wire repositories to a real database (PostgreSQL preferred).
- Introduce authentication/authorization flows once Supabase details are finalized.
- Connect this backend to the existing Vite frontend via REST or WebSocket endpoints.
