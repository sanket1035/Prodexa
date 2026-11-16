from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.api import analytics, auth, duplicates, issues, priorities, repositories, webhooks
from app.api.health import router as health_router
from app.core.config import settings

app = FastAPI(title="Prodexa", version="0.1.0")
# Signed cookie holds only the user id; GitHub tokens never reach the browser.
app.add_middleware(
    SessionMiddleware, secret_key=settings.session_secret, https_only=False, same_site="lax", max_age=60 * 60 * 24 * 7
)
app.include_router(health_router)
app.include_router(auth.router)
app.include_router(repositories.router)
app.include_router(webhooks.router)
app.include_router(issues.router)
app.include_router(duplicates.router)
app.include_router(priorities.router)
app.include_router(analytics.router)
