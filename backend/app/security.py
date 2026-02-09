"""Optional API-Key middleware."""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class ApiKeyMiddleware(BaseHTTPMiddleware):
    """
    If API_KEY is configured, all /api/* requests must carry
    the correct X-API-Key header.  Non-/api routes (health, etc.) pass through.
    """

    async def dispatch(self, request: Request, call_next):
        if settings.api_key:
            if request.url.path.startswith("/api"):
                key = request.headers.get("X-API-Key")
                if key != settings.api_key:
                    raise HTTPException(status_code=401, detail="Invalid or missing API key")
        return await call_next(request)
