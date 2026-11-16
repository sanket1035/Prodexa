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

## Status
Week 1 skeleton only: health endpoint, schema and migration, CI, Docker Compose. GitHub OAuth, sync, ML and analytics are not built yet. See the roadmap in the README.
