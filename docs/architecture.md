# Architecture

Prodexa is a modular monolith: one FastAPI service holding the domain logic, plus (from Week 7) a Celery worker for slow or retryable jobs. PostgreSQL is the source of truth; pgvector stores issue embeddings in the same database.

```
React/TS frontend --> FastAPI (api, services, integrations)
                          |--> PostgreSQL + pgvector
                          |--> Redis --> Celery worker (sync, embeddings)   [planned]
GitHub REST API + webhooks --> FastAPI
```

## Decisions
- Modular monolith first; split only if independent scaling is demonstrated.
- Webhooks for freshness, periodic reconciliation for missed events.
- Webhook idempotency: `sync_events.provider_event_id` is the primary key, so a redelivered event violates the constraint instead of being processed twice (covered by `tests/integration/test_schema.py`).
- Embeddings are keyed by `(issue_id, model_name, model_version)` so they can be regenerated when the model changes. Dimension 384 matches the planned baseline `all-MiniLM-L6-v2`.
- LLM calls stay out of deterministic workflows.

## Background jobs
`POST /repositories/{id}/jobs` creates a `sync_jobs` row and queues it in Redis. A Celery worker runs it. Transient GitHub errors are retried with exponential backoff (30 s doubling, capped at 15 min, 5 retries); after that the job is `failed` with its last error, visible in the API, and can be retried by hand. Jobs are acknowledged only after they finish, so a crashed worker's job is redelivered; running a job twice is safe because imports are upserts. An hourly `beat` task creates a sync job for each repository with none queued or running, which recovers anything a missed webhook skipped. The synchronous `POST /repositories/{id}/sync` still exists for small repositories.

## Status
Implemented: GitHub login, sync and webhooks, issue list and classification baseline, duplicate suggestions, priority and analytics, background jobs, hardening. Not implemented: change impact analysis, GitHub App for private repositories, automatic webhook registration, hosting. See the README.
