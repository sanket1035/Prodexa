import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from app.api import analytics, audit, auth, duplicates, issues, jobs, priorities, repositories, webhooks
from app.core.config import settings
from app.core.logging import RequestContextMiddleware, configure_logging
from app.db.session import engine

configure_logging()
log = logging.getLogger("prodexa")


def check_production_settings() -> None:
    """Refuse to start in production with unsafe defaults."""
    if settings.environment != "production":
        return
    problems = []
    if settings.session_secret in ("", "change-me") or len(settings.session_secret) < 32:
        problems.append("SESSION_SECRET must be set to a random value of at least 32 characters")
    if not settings.github_webhook_secret:
        problems.append("GITHUB_WEBHOOK_SECRET must be set")
    if not settings.github_client_id or not settings.github_client_secret:
        problems.append("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set")
    if problems:
        raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))


check_production_settings()

app = FastAPI(title="Prodexa", version="0.1.0")
# Signed cookie holds only the user id; GitHub tokens never reach the browser.
app.add_middleware(
    SessionMiddleware, secret_key=settings.session_secret, same_site="lax", max_age=60 * 60 * 24 * 7,
    https_only=settings.cookie_secure or settings.environment == "production",
)
app.add_middleware(RequestContextMiddleware)


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return JSONResponse({"detail": exc.detail, "request_id": getattr(request.state, "request_id", None)},
                        status_code=exc.status_code, headers=exc.headers)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    rid = getattr(request.state, "request_id", None) or uuid.uuid4().hex[:16]
    log.error("unhandled error", exc_info=exc, extra={"extra_fields": {"request_id": rid}})
    return JSONResponse({"detail": "Internal server error", "request_id": rid}, status_code=500)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
def ready():
    """Readiness: database must answer; Redis is reported but only the database is required."""
    checks = {"database": "ok", "redis": "ok"}
    try:
        with engine.connect() as c:
            c.execute(text("select 1"))
    except Exception:
        checks["database"] = "down"
    try:
        import redis

        redis.Redis.from_url(settings.redis_url, socket_connect_timeout=1).ping()
    except Exception:
        checks["redis"] = "down"
    return JSONResponse(checks, status_code=200 if checks["database"] == "ok" else 503)


app.include_router(auth.router)
app.include_router(repositories.router)
app.include_router(webhooks.router)
app.include_router(issues.router)
app.include_router(duplicates.router)
app.include_router(priorities.router)
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(jobs.router)
