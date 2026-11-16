from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.config import settings
from app.main import app
from app.ml import classification as cls
from app.models import Issue, IssuePrediction, Repository
from tests.integration.test_github_sync import env, login_as, make_user  # noqa: F401  (fixtures/helpers)


@pytest.fixture()
def setup(env):  # noqa: F811
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    with env() as s:
        rows = [
            ("crash on save", "traceback exception", "open", ["bug"]),
            ("typo in readme", "docs fix", "closed", ["documentation"]),
            ("100% slow_query", "perf", "open", []),
            ("add dark mode", "feature please", "open", ["enhancement", "ui"]),
        ]
        for n, (t, b, st, labels) in enumerate(rows):
            s.add(Issue(repository_id=repo["id"], github_issue_id=n + 1, number=n + 1, title=t, body=b,
                        state=st, labels=labels, created_at=base + timedelta(days=n)))
        s.commit()
    return c, repo, env


def test_filters_pagination_and_search(setup):
    c, repo, _ = setup
    url = f"/api/v1/repositories/{repo['id']}/issues"
    all_ = c.get(url).json()
    assert all_["total"] == 4
    assert [i["number"] for i in all_["items"]] == [4, 3, 2, 1]  # newest first
    assert c.get(url, params={"state": "closed"}).json()["total"] == 1
    assert c.get(url, params={"label": "bug"}).json()["total"] == 1
    assert c.get(url, params={"q": "README"}).json()["total"] == 1  # case-insensitive
    assert c.get(url, params={"q": "100%"}).json()["total"] == 1  # % is literal, not a wildcard
    assert c.get(url, params={"q": "%"}).json()["total"] == 1
    p2 = c.get(url, params={"page": 2, "page_size": 3}).json()
    assert len(p2["items"]) == 1 and p2["total"] == 4
    assert c.get(url, params={"state": "bogus"}).status_code == 422
    assert c.get(url, params={"page_size": 1000}).status_code == 422


def test_issue_detail_and_tenant_isolation(setup):
    c, repo, env = setup
    issue_id = c.get(f"/api/v1/repositories/{repo['id']}/issues").json()["items"][0]["id"]
    d = c.get(f"/api/v1/issues/{issue_id}").json()
    assert d["body"] == "feature please" and d["prediction"] is None
    other = TestClient(app)
    login_as(other, make_user(env, "mallory"))
    assert other.get(f"/api/v1/repositories/{repo['id']}/issues").status_code == 404
    assert other.get(f"/api/v1/issues/{issue_id}").status_code == 404
    assert other.post(f"/api/v1/issues/{issue_id}/classify").status_code == 404


def test_classify_without_model_is_409(setup, tmp_path, monkeypatch):
    c, repo, _ = setup
    monkeypatch.setattr(settings, "model_dir", str(tmp_path))
    issue_id = c.get(f"/api/v1/repositories/{repo['id']}/issues").json()["items"][0]["id"]
    assert c.post(f"/api/v1/issues/{issue_id}/classify").status_code == 409


def test_classify_stores_and_reuses_prediction(setup, tmp_path, monkeypatch):
    c, repo, env = setup
    monkeypatch.setattr(settings, "model_dir", str(tmp_path))
    texts = [f"crash exception traceback {i}" for i in range(10)] + [f"readme docs typo {i}" for i in range(10)]
    cls.train_and_save(texts, ["bug"] * 10 + ["documentation"] * 10, str(tmp_path))
    items = c.get(f"/api/v1/repositories/{repo['id']}/issues", params={"q": "crash"}).json()["items"]
    r1 = c.post(f"/api/v1/issues/{items[0]['id']}/classify").json()
    assert r1["category"] == "bug"
    r2 = c.post(f"/api/v1/issues/{items[0]['id']}/classify").json()
    assert r2 == r1
    with env() as s:
        assert s.scalar(select(func.count()).select_from(IssuePrediction)) == 1
    assert c.get(f"/api/v1/issues/{items[0]['id']}").json()["prediction"]["category"] == "bug"
