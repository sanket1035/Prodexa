from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.api.duplicates import get_embedder_dep
from app.main import app
from app.ml.embeddings import HashingEmbedder
from app.models import Issue, PullRequest
from tests.integration.test_github_sync import env, login_as, make_user  # noqa: F401

NOW = datetime.now(timezone.utc)


@pytest.fixture()
def setup(env):  # noqa: F811
    app.dependency_overrides[get_embedder_dep] = lambda: HashingEmbedder()
    c = TestClient(app)
    login_as(c, make_user(env, "alice"))
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    rid = repo["id"]
    d = lambda n: NOW - timedelta(days=n)  # noqa: E731
    with env() as s:
        spec = [  # number, title, state, labels, comments, created, closed, author
            (1, "Crash saving file", "open", ["critical", "bug"], 4, d(2), None, "ann"),
            (2, "Crash while saving the file", "open", ["bug"], 0, d(3), None, "bob"),
            (3, "Add dark mode", "open", ["enhancement"], 1, d(100), None, "ann"),
            (4, "Fix typo in docs", "closed", ["documentation"], 0, d(20), d(18), "bob"),
            (5, "Slow query", "closed", ["performance"], 2, d(30), d(20), "ann"),
        ]
        for n, t, st, lab, cm, cr, cl, au in spec:
            s.add(Issue(repository_id=rid, github_issue_id=n, number=n, title=t, body=t, state=st, labels=lab,
                        comments_count=cm, created_at=cr, closed_at=cl, author_login=au))
        s.add(PullRequest(repository_id=rid, github_pr_id=1, state="closed", created_at=d(10), merged_at=d(8), author_login="ann"))
        s.add(PullRequest(repository_id=rid, github_pr_id=2, state="closed", created_at=d(6), merged_at=d(2), author_login="bob"))
        s.add(PullRequest(repository_id=rid, github_pr_id=3, state="open", created_at=d(1), author_login="ann"))
        s.commit()
    c.post(f"/api/v1/repositories/{rid}/embed")
    ids = {i["number"]: i["id"] for i in c.get(f"/api/v1/repositories/{rid}/issues").json()["items"]}
    return c, rid, ids, env


def test_priority_breakdown_and_ranking(setup):
    c, rid, ids, _ = setup
    top = c.get(f"/api/v1/repositories/{rid}/priorities").json()
    assert top["total_open"] == 3
    assert [i["number"] for i in top["items"]][0] == 1  # critical + discussed + recent + has a similar report
    d = c.get(f"/api/v1/issues/{ids[1]}/priority").json()
    assert d["applicable"] and {f["name"] for f in d["factors"]} == {"severity", "frequency", "recency", "impact"}
    assert d["score"] == pytest.approx(sum(f["contribution"] for f in d["factors"]), abs=0.2)
    freq = next(f for f in d["factors"] if f["name"] == "frequency")
    assert freq["value"] > 0  # issue 2 is a similar open report
    assert c.get(f"/api/v1/issues/{ids[4]}/priority").json()["applicable"] is False  # closed


def test_override_replaces_score_and_can_be_cleared(setup):
    c, rid, ids, _ = setup
    base = c.get(f"/api/v1/issues/{ids[3]}/priority").json()["computed_score"]
    r = c.put(f"/api/v1/issues/{ids[3]}/priority/override", json={"score": 99, "note": "customer escalation"}).json()
    assert r["score"] == 99 and r["computed_score"] == base and r["override"]["note"] == "customer escalation"
    assert c.get(f"/api/v1/repositories/{rid}/priorities").json()["items"][0]["number"] == 3
    assert c.put(f"/api/v1/issues/{ids[3]}/priority/override", json={"score": 101}).status_code == 422
    assert c.delete(f"/api/v1/issues/{ids[3]}/priority/override").json()["score"] == base


def test_priority_tenant_isolation(setup):
    c, rid, ids, env = setup
    m = TestClient(app)
    login_as(m, make_user(env, "mallory"))
    assert m.get(f"/api/v1/repositories/{rid}/priorities").status_code == 404
    assert m.get(f"/api/v1/issues/{ids[1]}/priority").status_code == 404
    assert m.put(f"/api/v1/issues/{ids[1]}/priority/override", json={"score": 1}).status_code == 404
    assert m.get("/api/v1/analytics/overview", params={"repo_id": rid}).status_code == 404
    assert m.get("/api/v1/analytics/issues", params={"repo_id": rid}).status_code == 404


def test_overview_matches_independent_sql_and_hand_values(setup):
    c, rid, _, env = setup
    o = c.get("/api/v1/analytics/overview", params={"repo_id": rid}).json()
    # Hand-computed from the fixture data above.
    assert (o["open_issues"], o["closed_issues"], o["resolved_issues"]) == (3, 2, 2)
    assert o["median_resolution_days"] == pytest.approx(6.0, abs=0.01)  # resolutions of 2 and 10 days -> median 6
    assert o["merged_pull_requests"] == 2
    assert o["median_pr_cycle_days"] == pytest.approx(3.0, abs=0.01)  # cycle times 2 and 4 days
    assert o["avg_open_issue_age_days"] == pytest.approx((2 + 3 + 100) / 3, abs=0.05)
    with env() as s:  # independent check straight from the database
        n = s.execute(text("select count(*) from issues where repository_id=:r and state='open'"), {"r": rid}).scalar()
        assert n == o["open_issues"]


def test_trends_categories_contributors(setup):
    c, rid, _, _ = setup
    t = c.get("/api/v1/analytics/issues", params={"repo_id": rid, "weeks": 12}).json()
    assert len(t["weekly"]) == 12
    # Issue 3 is 100 days old, outside the 12-week window, so 4 of the 5 issues were opened inside it.
    assert sum(w["opened"] for w in t["weekly"]) == 4 and sum(w["closed"] for w in t["weekly"]) == 2
    assert t["categories"] == {"bug": 2, "documentation": 1, "feature request": 1, "performance": 1}
    ann = next(x for x in t["contributors"] if x["login"] == "ann")
    assert ann == {"login": "ann", "issues_opened": 3, "prs_opened": 2, "prs_merged": 1}
    assert c.get("/api/v1/analytics/issues", params={"repo_id": rid, "weeks": 0}).status_code == 422
