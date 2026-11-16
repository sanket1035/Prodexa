import hashlib
import hmac
import json
import uuid

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, sessionmaker

from app.api.deps import get_github_client
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.integrations.github import GitHubClient
from app.main import app
from app.models import Issue, Membership, Organization, PullRequest, Repository, SyncEvent, User

SECRET = "test-webhook-secret"


def _issue(i, state="open", pr=False):
    d = {"id": i, "title": f"issue {i}", "body": "b", "state": state,
         "created_at": "2026-01-01T00:00:00Z", "closed_at": None}
    if pr:
        d["pull_request"] = {}
    return d


def fake_github():
    def handler(req: httpx.Request) -> httpx.Response:
        p = req.url.path
        if p == "/repos/acme/app":
            return httpx.Response(200, json={"id": 555, "full_name": "acme/app"})
        if p == "/repos/acme/app/issues":
            if req.url.params.get("page") == "2":
                return httpx.Response(200, json=[_issue(3, "closed")])
            return httpx.Response(
                200, json=[_issue(1), _issue(2, pr=True)],
                headers={"link": '<https://api.github.com/repos/acme/app/issues?page=2>; rel="next"'},
            )
        if p == "/repos/acme/app/pulls":
            return httpx.Response(200, json=[{"id": 90, "state": "closed", "created_at": "2026-01-02T00:00:00Z",
                                              "merged_at": "2026-01-03T00:00:00Z"}])
        if p == "/user/repos":
            return httpx.Response(200, json=[{"id": 555, "full_name": "acme/app"}])
        return httpx.Response(404, json={})
    return httpx.MockTransport(handler)


@pytest.fixture()
def env(engine, monkeypatch):
    with engine.begin() as c:
        c.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    Local = sessionmaker(bind=engine, expire_on_commit=False)
    monkeypatch.setattr(settings, "github_webhook_secret", SECRET)

    def _db():
        s = Local()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_github_client] = lambda: GitHubClient("t", transport=fake_github())
    yield Local
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def make_user(Local, login):
    with Local() as s:
        u = User(email=f"{login}@x.com", github_login=login)
        s.add(u)
        s.flush()
        o = Organization(name=login, owner_id=u.id)
        s.add(o)
        s.flush()
        s.add(Membership(user_id=u.id, organization_id=o.id, role="owner"))
        s.commit()
        return u.id


def login_as(client, user_id):
    # Sign a session cookie the same way SessionMiddleware does.
    import base64

    import itsdangerous

    signer = itsdangerous.TimestampSigner(settings.session_secret)
    data = base64.b64encode(json.dumps({"user_id": str(user_id)}).encode())
    client.cookies.set("session", signer.sign(data).decode())


def test_requires_login(env):
    assert TestClient(app).get("/api/v1/repositories").status_code == 401


def test_connect_and_sync_is_idempotent_and_skips_pr_rows_in_issues(env):
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    r1 = c.post(f"/api/v1/repositories/{repo['id']}/sync").json()
    assert r1 == {"issues": 2, "pull_requests": 1}  # pagination followed; PR row in /issues skipped
    c.post(f"/api/v1/repositories/{repo['id']}/sync")  # second run must not duplicate
    with env() as s:
        assert s.scalar(select(func.count()).select_from(Issue)) == 2
        assert s.scalar(select(func.count()).select_from(PullRequest)) == 1


def test_other_tenant_cannot_see_or_sync_repository(env):
    owner, other = TestClient(app), TestClient(app)
    login_as(owner, make_user(env, "alice"))
    login_as(other, make_user(env, "mallory"))
    repo = owner.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    assert other.get("/api/v1/repositories").json() == []
    assert other.post(f"/api/v1/repositories/{repo['id']}/sync").status_code == 404
    assert other.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).status_code == 409


def sign(body: bytes) -> str:
    return "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()


def post_hook(c, payload, delivery, event="issues", sig=None):
    body = json.dumps(payload).encode()
    return c.post("/api/v1/webhooks/github", content=body, headers={
        "X-GitHub-Event": event, "X-GitHub-Delivery": delivery,
        "X-Hub-Signature-256": sig or sign(body)})


def test_webhook_rejects_bad_signature(env):
    c = TestClient(app)
    assert post_hook(c, {"x": 1}, "d1", sig="sha256=deadbeef").status_code == 401


def test_webhook_replay_processed_once(env):
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"})
    payload = {"repository": {"id": 555}, "issue": _issue(10)}
    assert post_hook(c, payload, "delivery-A").json() == {"status": "ok"}
    payload["issue"]["title"] = "changed on replay"
    assert post_hook(c, payload, "delivery-A").json() == {"status": "duplicate"}
    with env() as s:
        assert s.scalar(select(Issue.title).where(Issue.github_issue_id == 10)) == "issue 10"
        assert s.scalar(select(func.count()).select_from(SyncEvent)) == 1


def test_webhook_updates_existing_issue(env):
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"})
    post_hook(c, {"repository": {"id": 555}, "issue": _issue(10)}, "d1")
    post_hook(c, {"repository": {"id": 555}, "issue": _issue(10, "closed")}, "d2")
    with env() as s:
        assert s.scalar(select(Issue.state).where(Issue.github_issue_id == 10)) == "closed"
