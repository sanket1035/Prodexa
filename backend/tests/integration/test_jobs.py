import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.api.duplicates import get_embedder_dep  # noqa: F401
from app.core import ratelimit
from app.core.config import settings
from app.core.crypto import encrypt
from app.integrations.github import GitHubClient, GitHubError
from app.main import app
from app.ml.embeddings import HashingEmbedder
from app.models import GithubAccount, Issue, Organization, Repository, SyncJob, User
from app.workers import jobs, tasks
from tests.integration.test_github_sync import env, fake_github, login_as, make_user  # noqa: F401


@pytest.fixture(autouse=True)
def _reset():
    ratelimit.reset()


@pytest.fixture()
def ctx(env, monkeypatch):  # noqa: F811
    from app.workers.celery_app import celery_app

    celery_app.conf.task_always_eager = True
    monkeypatch.setattr(tasks, "SessionLocal", env)  # workers use the test database
    monkeypatch.setattr(tasks, "get_embedder", lambda _: HashingEmbedder())
    monkeypatch.setattr(jobs, "github_client_factory", lambda tok: GitHubClient(tok, transport=fake_github()))
    uid = make_user(env, "alice")
    with env() as s:  # the repository owner needs a stored GitHub token for background jobs
        s.add(GithubAccount(user_id=uid, access_token_enc=encrypt("tok")))
        s.commit()
    c = TestClient(app)
    login_as(c, uid)
    repo = c.post("/api/v1/repositories/connect", json={"full_name": "acme/app"}).json()
    yield c, repo, env, uid
    celery_app.conf.task_always_eager = False


def test_enqueue_sync_then_embed_runs_and_is_visible(ctx):
    c, repo, env, _ = ctx
    j = c.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "sync"})
    assert j.status_code == 202
    assert j.json()["status"] == "succeeded" and j.json()["result"] == {"issues": 2, "pull_requests": 1}
    e = c.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "embed"}).json()
    assert e["status"] == "succeeded" and e["result"] == {"embedded": 2}
    listed = c.get(f"/api/v1/repositories/{repo['id']}/jobs").json()
    assert [x["kind"] for x in listed] == ["embed", "sync"]
    assert c.get(f"/api/v1/repositories/{repo['id']}/jobs", params={"status": "failed"}).json() == []
    assert c.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "nope"}).status_code == 422


def test_jobs_tenant_isolation(ctx):
    c, repo, env, _ = ctx
    job = c.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "sync"}).json()
    m = TestClient(app)
    login_as(m, make_user(env, "mallory"))
    assert m.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "sync"}).status_code == 404
    assert m.get(f"/api/v1/repositories/{repo['id']}/jobs").status_code == 404
    assert m.post(f"/api/v1/jobs/{job['id']}/retry").status_code == 404


class Boom:
    def __call__(self, token):
        raise GitHubError("rate limited")


def _job(env, repo_id):
    with env() as s:
        j = jobs.create_job(s, repo_id, "sync")
        s.commit()
        return j.id


def test_transient_failure_requeues_then_fails_after_retries(ctx):
    _, repo, env, _ = ctx
    jid = _job(env, repo["id"])
    with env() as s:
        with pytest.raises(jobs.RetryableJobError):
            jobs.execute_job(s, jid, HashingEmbedder(), retries_so_far=0, max_retries=2, client_factory=Boom())
    with env() as s:
        j = s.get(SyncJob, jid)
        assert (j.status, j.attempts, j.error) == ("queued", 1, "rate limited")
    with env() as s:  # retries exhausted: job becomes failed and stays visible
        out = jobs.execute_job(s, jid, HashingEmbedder(), retries_so_far=2, max_retries=2, client_factory=Boom())
        assert out.status == "failed" and out.error == "rate limited" and out.attempts == 2


def test_permanent_failure_is_not_retried_and_failed_job_can_be_retried_manually(ctx):
    c, repo, env, uid = ctx
    with env() as s:  # remove the token: a configuration problem, not a transient one
        s.delete(s.get(GithubAccount, uid))
        s.commit()
    j = c.post(f"/api/v1/repositories/{repo['id']}/jobs", json={"kind": "sync"}).json()
    assert j["status"] == "failed" and "no connected GitHub account" in j["error"] and j["attempts"] == 1
    assert c.post(f"/api/v1/jobs/{j['id']}/retry").json()["status"] == "failed"  # still no token
    with env() as s:
        s.add(GithubAccount(user_id=uid, access_token_enc=encrypt("tok")))
        s.commit()
    assert c.post(f"/api/v1/jobs/{j['id']}/retry").json()["status"] == "succeeded"
    assert c.post(f"/api/v1/jobs/{j['id']}/retry").status_code == 409  # only failed jobs


def test_execute_job_is_safe_to_call_twice(ctx):
    _, repo, env, _ = ctx
    jid = _job(env, repo["id"])
    with env() as s:
        jobs.execute_job(s, jid, HashingEmbedder(), 0, 5, client_factory=lambda t: GitHubClient(t, transport=fake_github()))
    with env() as s:
        again = jobs.execute_job(s, jid, HashingEmbedder(), 0, 5, client_factory=Boom())
        assert again.status == "succeeded" and again.attempts == 1  # no second run
        assert s.scalar(select(func.count()).select_from(Issue)) == 2


def test_reconcile_creates_one_job_per_idle_repository(ctx):
    _, repo, env, _ = ctx
    with env() as s:
        first = jobs.reconcile(s)
        assert len(first) == 1
        assert jobs.reconcile(s) == []  # already queued, so no duplicate
