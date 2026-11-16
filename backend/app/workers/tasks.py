import uuid

from app.core.config import settings
from app.db.session import SessionLocal
from app.ml.embeddings import get_embedder
from app.workers.celery_app import celery_app
from app.workers.jobs import RetryableJobError, execute_job, reconcile


@celery_app.task(name="prodexa.run_job", bind=True, max_retries=settings.job_max_retries)
def run_job(self, job_id: str) -> None:
    with SessionLocal() as db:
        try:
            execute_job(db, uuid.UUID(job_id), get_embedder(settings.embedder), self.request.retries, self.max_retries)
        except RetryableJobError as e:
            # Exponential backoff with a cap: 30s, 60s, 120s, ... up to 15 minutes.
            raise self.retry(exc=e, countdown=min(30 * 2**self.request.retries, 900)) from e


@celery_app.task(name="prodexa.reconcile_all")
def reconcile_all() -> int:
    with SessionLocal() as db:
        ids = reconcile(db)
    for i in ids:
        run_job.delay(str(i))
    return len(ids)
