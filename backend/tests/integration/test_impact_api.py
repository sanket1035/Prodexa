import httpx
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_github_client
from app.core import ratelimit
from app.core.config import settings
from app.integrations.github import GitHubClient
from app.main import app
from app.services.history import history_path
from tests.integration.test_github_sync import env, login_as, make_user  # noqa: F401
from tests.integration.test_jobs import ctx  # noqa: F401  (fixture)
from tests.unit.test_impact import commit, git


@pytest.fixture(autouse=True)
def _reset():
    ratelimit.reset()


@pytest.fixture()
def remote(tmp_path, monkeypatch):
    src = tmp_path / "remote" / "acme" / "app"
    src.mkdir(parents=True)
    git(src, "init", "-q", "-b", "main")
    d = lambda n: f"2026-01-{n:02d}T10:00:00"  # noqa: E731
    commit(src, {"app/models.py": "x = 1\n", "app/service.py": "from app import models\n", "tests/test_service.py": "from app import service\n"}, "initial", d(1))
    commit(src, {"app/models.py": "x = 2\n", "app/schema.sql": "-- 1\n"}, "add column", d(2))
    commit(src, {"app/models.py": "x = 3\n", "app/schema.sql": "-- 2\n"}, "rename column", d(3))
    monkeypatch.setattr(settings, "git_base_url", f"file://{tmp_path / 'remote'}")
    monkeypatch.setattr(settings, "workspace_dir", str(tmp_path / "ws"))
    return src


def test_requires_history_then_reports_evidence(ctx, remote):  # noqa: F811
    c, repo, env, _ = ctx
    url = f"/api/v1/repositories/{repo['id']}"
    assert c.post(f"{url}/impact", json={"files": [{"path": "app/models.py"}]}).status_code == 409
    job = c.post(f"{url}/jobs", json={"kind": "history"}).json()
    assert job["status"] == "succeeded" and job["result"]["commits"] == 3
    r = c.post(f"{url}/impact", json={"files": [{"path": "app/models.py", "additions": 3, "deletions": 1}]})
    assert r.status_code == 200
    out = r.json()
    assert out["missing_cochanges"][0]["path"] == "app/schema.sql"
    assert "tests/test_service.py" in out["affected_tests"]
    assert out["note"].startswith("Provisional")
    again = c.post(f"{url}/jobs", json={"kind": "history"}).json()  # update path (fetch) works too
    assert again["status"] == "succeeded"


def test_impact_from_pull_request_number(ctx, remote, monkeypatch):  # noqa: F811
    c, repo, _, _ = ctx
    c.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "history"})

    def handler(req):
        assert req.url.path == "/repos/acme/app/pulls/7/files"
        return httpx.Response(200, json=[{"filename": "app/models.py", "additions": 2, "deletions": 0}])

    app.dependency_overrides[get_github_client] = lambda: GitHubClient("t", transport=httpx.MockTransport(handler))
    r = c.post(f"/api/v1/repositories/{repo['id']}/impact", json={"pr_number": 7})
    assert r.status_code == 200 and r.json()["files"] == ["app/models.py"]


def test_input_validation_and_tenant_isolation(ctx, remote):  # noqa: F811
    c, repo, env, _ = ctx
    url = f"/api/v1/repositories/{repo['id']}/impact"
    assert c.post(url, json={}).status_code == 422
    assert c.post(url, json={"pr_number": 1, "files": [{"path": "a.py"}]}).status_code == 422
    assert c.post(url, json={"files": []}).status_code in (409, 422)
    m = TestClient(app)
    login_as(m, make_user(env, "mallory"))
    assert m.post(url, json={"files": [{"path": "a.py"}]}).status_code == 404


def test_history_path_rejects_traversal():
    for bad in ("../etc/passwd", "a/b/c", "a b/c", "x/..", ""):
        with pytest.raises(ValueError):
            history_path(bad)
    assert history_path("acme/app").name == "acme__app"
