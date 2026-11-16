# Database

Defined in `backend/app/models/__init__.py`; the initial migration is `backend/migrations/versions/0001_initial_schema.py`.

Tables: users, organizations, memberships (unique user/org), repositories (unique `github_repo_id`), issues and pull_requests (unique per repository + GitHub id, indexed on repository + state), issue_embeddings (pgvector, 384 dims), issue_predictions, sync_events (provider event id as primary key), audit_logs.

Provider identifiers are stored separately from internal UUIDs. Every repository-scoped query must filter by organization to keep tenants isolated (not yet enforced; no API exists yet).

Not yet present: vector index (add HNSW once there is data to tune against), session/token storage.
