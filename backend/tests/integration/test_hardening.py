import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core import ratelimit
from app.core.config import settings
from app.main import app, check_production_settings
from app.models import AuditLog, Membership
from tests.integration.test_github_sync import env, login_as, make_user  # noqa: F401


@pytest.fixture(autouse=True)
def _clean_limits():
    ratelimit.reset()
    yield
    ratelimit.reset()


def test_security_headers_and_request_id():
    r = TestClient(app).get("/health", headers={"X-Request-ID": "abc123"})
    assert r.headers["x-request-id"] == "abc123"
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert "default-src 'none'" in r.headers["content-security-policy"]


def test_errors_carry_request_id_and_do_not_leak():
    r = TestClient(app).get("/api/v1/repositories")
    assert r.status_code == 401 and r.json()["detail"] == "Not authenticated" and r.json()["request_id"]


def test_unhandled_error_is_generic(monkeypatch):
    @app.get("/_boom")
    def boom():
        raise RuntimeError("secret internals")

    r = TestClient(app, raise_server_exceptions=False).get("/_boom")
    assert r.status_code == 500 and r.json()["detail"] == "Internal server error"
    assert "secret" not in r.text


def test_readiness_reports_database(engine):
    r = TestClient(app).get("/health/ready")
    assert r.json()["database"] == "ok"


def test_production_refuses_unsafe_config(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "session_secret", "change-me")
    with pytest.raises(RuntimeError, match="SESSION_SECRET"):
        check_production_settings()
    monkeypatch.setattr(settings, "session_secret", "x" * 40)
    monkeypatch.setattr(settings, "github_webhook_secret", "")
    with pytest.raises(RuntimeError, match="GITHUB_WEBHOOK_SECRET"):
        check_production_settings()


def test_rate_limit_returns_429_with_retry_after(env, monkeypatch):  # noqa: F811
    monkeypatch.setattr(settings, "rate_limit_per_minute", 2)
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    url = f"/api/v1/repositories/{repo['id']}/sync"
    assert [c.post(url).status_code for _ in range(3)] == [200, 200, 429]
    assert "retry-after" in c.post(url).headers


def test_audit_log_written_and_visible_to_owner_only(env):  # noqa: F811
    c = TestClient(app)
    uid = make_user(env, "alice")
    login_as(c, uid)
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    c.post(f"/api/v1/repositories/{repo['id']}/sync")
    actions = [a["action"] for a in c.get("/api/v1/audit-logs").json()]
    assert "repository.connect" in actions and "repository.sync" in actions
    other = TestClient(app)
    login_as(other, make_user(env, "mallory"))
    assert other.get("/api/v1/audit-logs").json() == []  # sees only their own organization's entries
    with env() as s:  # a plain member must not see the log
        m = s.scalar(select(Membership).where(Membership.user_id == uid))
        m.role = "member"
        s.commit()
    assert c.get("/api/v1/audit-logs").json() == []
    with env() as s:
        assert s.scalars(select(AuditLog)).all()
