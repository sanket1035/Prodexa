from celery import Celery

from app.core.config import settings

celery_app = Celery("prodexa", broker=settings.redis_url, include=["app.workers.tasks"])
celery_app.conf.update(
    task_always_eager=settings.celery_eager,
    task_acks_late=True,  # a job is acknowledged only after it finishes, so a crashed worker's job is redelivered
    worker_prefetch_multiplier=1,
    task_serializer="json",
    broker_connection_retry_on_startup=True,
    beat_schedule={
        # Webhooks can be missed, so re-sync every connected repository once an hour.
        "reconcile-repositories": {"task": "prodexa.reconcile_all", "schedule": 3600.0},
    },
)
