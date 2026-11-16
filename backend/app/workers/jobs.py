"""Job execution logic, kept separate from Celery so it can be tested directly."""
import uuid
from collections.abc import Callable
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.crypto import decrypt
from app.integrations.github import GitHubClient, GitHubError
from app.ml.embeddings import Embedder
from app.models import GithubAccount, Organization, Repository, SyncJob
from app.services.duplicates import embed_repository
from app.services.history import ensure_history
from app.services.sync import sync_repository


class RetryableJobError(Exception):
    """The job failed in a way that may succeed later (rate limit, network, GitHub outage)."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_job(db: Session, repository_id: uuid.UUID, kind: str) -> SyncJob:
    job = SyncJob(repository_id=repository_id, kind=kind, status="queued")
    db.add(job)
    db.flush()
    return job


def github_client_factory(token: str) -> GitHubClient:
    return GitHubClient(token)


def _owner_token(db: Session, repo: Repository) -> str:
    org = db.get(Organization, repo.organization_id)
    acct = db.get(GithubAccount, org.owner_id) if org else None
    if acct is None:
        raise ValueError("Repository owner has no connected GitHub account")
    return decrypt(acct.access_token_enc)


def execute_job(db: Session, job_id: uuid.UUID, embedder: Embedder, retries_so_far: int, max_retries: int,
                client_factory: Callable[[str], GitHubClient] | None = None) -> SyncJob:
    """Run one job. Transient GitHub errors raise RetryableJobError until retries run out, then the job is failed."""
    client_factory = client_factory or github_client_factory  # looked up at call time so tests can replace it
    job = db.get(SyncJob, job_id)
    if job is None or job.status in ("succeeded", "running"):
        return job
    job.status, job.attempts = "running", job.attempts + 1
    db.commit()
    try:
        repo = db.get(Repository, job.repository_id)
        if job.kind == "sync":
            job.result = sync_repository(db, client_factory(_owner_token(db, repo)), repo)
        elif job.kind == "embed":
            job.result = {"embedded": embed_repository(db, embedder, repo.id)}
        elif job.kind == "history":
            job.result = ensure_history(repo.full_name)
        else:
            raise ValueError(f"Unknown job kind {job.kind!r}")
        job.status, job.error, job.finished_at = "succeeded", None, _now()
        db.commit()
        return job
    except GitHubError as e:
        db.rollback()
        job = db.get(SyncJob, job_id)
        job.error = str(e)
        if retries_so_far >= max_retries:
            job.status, job.finished_at = "failed", _now()
            db.commit()
            return job
        job.status = "queued"
        db.commit()
        raise RetryableJobError(str(e)) from e
    except Exception as e:  # permanent failure: do not retry, keep it visible
        db.rollback()
        job = db.get(SyncJob, job_id)
        job.status, job.error, job.finished_at = "failed", f"{type(e).__name__}: {e}", _now()
        db.commit()
        return job


def reconcile(db: Session) -> list[uuid.UUID]:
    """Create a sync job for every repository that has none queued or running. Returns the new job ids."""
    active = select(SyncJob.repository_id).where(SyncJob.status.in_(["queued", "running"]), SyncJob.kind == "sync")
    repos = db.scalars(select(Repository).where(Repository.id.not_in(active))).all()
    ids = [create_job(db, r.id, "sync").id for r in repos]
    db.commit()
    return ids
