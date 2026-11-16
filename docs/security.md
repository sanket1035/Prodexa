# Security notes

What is implemented, and what is not.

| Area | Implemented | Not implemented / limits |
|---|---|---|
| Authentication | GitHub OAuth with a random `state` check; the session cookie is signed and holds only the user id; HTTPS-only cookie in production | No CSRF token on state-changing requests (relies on `SameSite=Lax` and JSON bodies); no session revocation list |
| GitHub token | Stored encrypted (Fernet, key derived from `SESSION_SECRET`), never sent to the browser | Rotating `SESSION_SECRET` makes stored tokens unreadable (users must sign in again); no separate key management service |
| Authorization | Every repository, issue, job and analytics route checks organization membership and returns 404 for other tenants; audit log visible to owners/admins only | Only the roles `owner`/`member` exist; no UI to invite members |
| Webhooks | HMAC-SHA256 signature check; delivery id is the primary key so replays are ignored | No request size limit beyond the server's |
| API safety | Input validation (pydantic/FastAPI), page size caps, per-user rate limit on expensive routes, security headers, generic 500 errors with a request id | Rate limiter is in process memory: not shared across processes or restarts |
| Secrets | `.env` is git-ignored; production refuses to start with a default or short `SESSION_SECRET` or missing webhook/OAuth settings | |
| Scope of GitHub access | OAuth scope `public_repo` only | Private repositories need a GitHub App (not built) |
| Data | Stores issue/PR titles, bodies, labels, authors' logins; deleting a repository cascades | No documented retention policy or user data export yet |
| Models | Classifier is saved with joblib (pickle) | Never load a model file you did not create |
| Logging | One structured JSON line per request with a request id | No central log shipping or error tracker is wired up |

Report a vulnerability by opening a private security advisory on the repository.
