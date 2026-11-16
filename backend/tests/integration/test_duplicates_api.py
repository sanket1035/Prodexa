from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.api.duplicates import get_embedder_dep
from app.main import app
from app.ml.embeddings import HashingEmbedder
from app.models import DuplicateFeedback, IssueEmbedding
from tests.integration.test_github_sync import env, login_as, make_user  # noqa: F401

ISSUES = [
    ("App crashes when saving a file", "Saving a large file to disk crashes the app with a traceback"),
    ("Crash on file save", "The app crashes while saving the file, traceback shown"),
    ("Add dark mode", "Please add a dark theme for the dashboard"),
    ("Dark theme request", "Would love a dark mode theme on the dashboard"),
]


@pytest.fixture()
def setup(env):  # noqa: F811
    from app.models import Issue

    app.dependency_overrides[get_embedder_dep] = lambda: HashingEmbedder()
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    with env() as s:
        for n, (t, b) in enumerate(ISSUES):
            s.add(Issue(repository_id=repo["id"], github_issue_id=n + 1, number=n + 1, title=t, body=b,
                        state="open", labels=[], created_at=base + timedelta(days=n)))
        s.commit()
    ids = {i["number"]: i["id"] for i in c.get(f"/api/v1/repositories/{repo['id']}/issues").json()["items"]}
    return c, repo, ids, env


def test_duplicates_require_embeddings_then_rank_pairs(setup):
    c, repo, ids, env = setup
    assert c.get(f"/api/v1/issues/{ids[1]}/duplicates").status_code == 409
    assert c.post(f"/api/v1/repositories/{repo['id']}/embed").json()["embedded"] == 4
    assert c.post(f"/api/v1/repositories/{repo['id']}/embed").json()["embedded"] == 0  # idempotent
    res = c.get(f"/api/v1/issues/{ids[1]}/duplicates", params={"min_similarity": 0.0}).json()
    cands = res["candidates"]
    assert cands[0]["number"] == 2  # the crash/save pair is the nearest neighbour
    assert cands[0]["similarity"] > cands[-1]["similarity"]
    assert "file" in cands[0]["shared_terms"]
    assert all(x["number"] != 1 for x in cands)  # never suggests itself
    d = c.get(f"/api/v1/issues/{ids[3]}/duplicates", params={"min_similarity": 0.0}).json()["candidates"]
    assert d[0]["number"] == 4


def test_min_similarity_filters_and_k_limits(setup):
    c, repo, ids, _ = setup
    c.post(f"/api/v1/repositories/{repo['id']}/embed")
    strict = c.get(f"/api/v1/issues/{ids[1]}/duplicates", params={"min_similarity": 0.99}).json()["candidates"]
    assert strict == []
    one = c.get(f"/api/v1/issues/{ids[1]}/duplicates", params={"k": 1, "min_similarity": 0.0}).json()["candidates"]
    assert len(one) == 1
    assert c.get(f"/api/v1/issues/{ids[1]}/duplicates", params={"k": 99}).status_code == 422


def test_feedback_saved_updated_and_shown(setup):
    c, repo, ids, env = setup
    c.post(f"/api/v1/repositories/{repo['id']}/embed")
    url = f"/api/v1/issues/{ids[1]}/duplicates/feedback"
    assert c.post(url, json={"candidate_id": ids[2], "is_duplicate": True}).status_code == 201
    assert c.post(url, json={"candidate_id": ids[2], "is_duplicate": False}).status_code == 201  # overwrite
    with env() as s:
        rows = s.scalars(select(DuplicateFeedback)).all()
        assert len(rows) == 1 and rows[0].is_duplicate is False
    top = c.get(f"/api/v1/issues/{ids[1]}/duplicates", params={"min_similarity": 0.0}).json()["candidates"][0]
    assert top["your_verdict"] is False
    assert c.post(url, json={"candidate_id": ids[1], "is_duplicate": True}).status_code == 404  # itself


def test_other_tenant_blocked_everywhere(setup):
    c, repo, ids, env = setup
    c.post(f"/api/v1/repositories/{repo['id']}/embed")
    m = TestClient(app)
    login_as(m, make_user(env, "mallory"))
    assert m.post(f"/api/v1/repositories/{repo['id']}/embed").status_code == 404
    assert m.get(f"/api/v1/issues/{ids[1]}/duplicates").status_code == 404
    assert m.post(f"/api/v1/issues/{ids[1]}/duplicates/feedback",
                  json={"candidate_id": ids[2], "is_duplicate": True}).status_code == 404
    with env() as s:
        assert s.scalar(select(func.count()).select_from(IssueEmbedding)) == 4
