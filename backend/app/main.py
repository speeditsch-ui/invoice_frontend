"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.security import ApiKeyMiddleware
from app.routers import documents

app = FastAPI(
    title="Result Viewer API",
    version="1.0.0",
    description="API for viewing and editing extracted document fields.",
)

# ── CORS ─────────────────────────────────────────────────
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Optional API-Key guard ───────────────────────────────
app.add_middleware(ApiKeyMiddleware)

# ── Routers ──────────────────────────────────────────────
app.include_router(documents.router)


# ── Health check ─────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}
