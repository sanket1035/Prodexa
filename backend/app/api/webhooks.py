import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import Repository, SyncEvent
from app.services.sync import upsert_issue, upsert_pr

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


def verify_signature(secret: str, body: bytes, header: str | None) -> bool:
    if not secret or not header or not header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)


@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str | None = Header(default=None),
    x_github_event: str | None = Header(default=None),
    x_github_delivery: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    body = await request.body()
    if not verify_signature(settings.github_webhook_secret, body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")
    if not x_github_delivery or not x_github_event:
        raise HTTPException(status_code=400, detail="Missing GitHub headers")
    payload = json.loads(body)

    repo = None
    if "repository" in payload:
        repo = db.scalar(select(Repository).where(Repository.github_repo_id == payload["repository"]["id"]))

    # Idempotency: the delivery id is the primary key, so a redelivery inserts nothing.
    res = db.execute(
        insert(SyncEvent)
        .values(
            provider_event_id=x_github_delivery,
            repository_id=repo.id if repo else None,
            event_type=x_github_event,
            processing_status="processed" if repo else "ignored",
        )
        .on_conflict_do_nothing()
        .returning(SyncEvent.provider_event_id)
    )
    if res.scalar_one_or_none() is None:  # conflict: this delivery was already recorded
        db.rollback()
        return {"status": "duplicate"}

    if repo and x_github_event == "issues" and "issue" in payload:
        upsert_issue(db, repo.id, payload["issue"])
    elif repo and x_github_event == "pull_request" and "pull_request" in payload:
        upsert_pr(db, repo.id, payload["pull_request"])
    db.commit()
    return {"status": "ok"}
