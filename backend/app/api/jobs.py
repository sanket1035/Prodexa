import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_repo_for_user
from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.models import SyncJob, User
from app.services import audit
from app.workers.jobs import create_job
from app.workers.tasks import run_job

router = APIRouter(prefix="/api/v1", tags=["jobs"])


def _out(j: SyncJob) -> dict:
    return {"id": str(j.id), "repository_id": str(j.repository_id), "kind": j.kind, "status": j.status,
            "attempts": j.attempts, "error": j.error, "result": j.result,
            "created_at": j.created_at.isoformat(), "finished_at": j.finished_at.isoformat() if j.finished_at else None}


def _enqueue(db: Session, job: SyncJob) -> None:
    try:
        run_job.delay(str(job.id))
    except Exception as e:  # broker unreachable: keep the job visible as failed instead of silently dropping it
        job.status, job.error = "failed", f"Could not enqueue: {type(e).__name__}"
        db.commit()
        raise HTTPException(status_code=503, detail="Job queue unavailable") from e


@router.post("/repositories/{repo_id}/jobs", status_code=202, dependencies=[Depends(rate_limit("jobs"))])
def enqueue(repo_id: uuid.UUID, kind: str = Body(embed=True), user: User = Depends(current_user),
            db: Session = Depends(get_db)):
    if kind not in ("sync", "embed"):
        raise HTTPException(status_code=422, detail="kind must be 'sync' or 'embed'")
    repo = get_repo_for_user(repo_id, user, db)
    job = create_job(db, repo.id, kind)
    audit.record(db, user.id, repo.organization_id, f"job.{kind}.enqueue", "job", job.id)
    db.commit()
    _enqueue(db, job)
    db.refresh(job)
    return _out(job)


@router.get("/repositories/{repo_id}/jobs")
def list_jobs(repo_id: uuid.UUID, status: str | None = Query(default=None), limit: int = Query(default=20, ge=1, le=100),
              user: User = Depends(current_user), db: Session = Depends(get_db)):
    get_repo_for_user(repo_id, user, db)
    q = select(SyncJob).where(SyncJob.repository_id == repo_id)
    if status:
        q = q.where(SyncJob.status == status)
    return [_out(j) for j in db.scalars(q.order_by(SyncJob.created_at.desc()).limit(limit))]


@router.post("/jobs/{job_id}/retry", status_code=202)
def retry(job_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    job = db.get(SyncJob, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    repo = get_repo_for_user(job.repository_id, user, db)
    if job.status != "failed":
        raise HTTPException(status_code=409, detail="Only failed jobs can be retried")
    job.status, job.error, job.finished_at = "queued", None, None
    audit.record(db, user.id, repo.organization_id, f"job.{job.kind}.retry", "job", job.id)
    db.commit()
    _enqueue(db, job)
    db.refresh(job)
    return _out(job)
