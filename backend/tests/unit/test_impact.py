import os
import subprocess

import pytest

from app.impact import evaluate as ev
from app.impact.cochange import CoChangeIndex
from app.impact.depgraph import DepGraph, is_test_file
from app.impact.gitlog import read_history
from app.impact.risk import ChangedFile, analyze

ENV = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@x", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@x"}


def git(path, *args, when=None):
    env = dict(ENV)
    if when:
        env["GIT_AUTHOR_DATE"] = env["GIT_COMMITTER_DATE"] = when
    subprocess.run(["git", "-C", str(path), *args], check=True, capture_output=True, env=env)


def commit(path, files: dict[str, str], msg, when):
    for name, body in files.items():
        p = path / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body)
    git(path, "add", "-A")
    git(path, "commit", "-q", "-m", msg, when=when)


@pytest.fixture()
def repo(tmp_path):
    git(tmp_path, "init", "-q", "-b", "main")
    d = lambda n: f"2026-01-{n:02d}T10:00:00"  # noqa: E731
    commit(tmp_path, {"app/models.py": "x = 1\n", "app/service.py": "from app import models\n", "tests/test_service.py": "from app import service\n"}, "initial", d(1))
    commit(tmp_path, {"app/models.py": "x = 2\n", "app/schema.sql": "-- 1\n"}, "add column", d(2))
    commit(tmp_path, {"app/models.py": "x = 3\n", "app/schema.sql": "-- 2\n"}, "fix wrong column type", d(3))
    commit(tmp_path, {"app/models.py": "x = 4\n", "app/schema.sql": "-- 3\n"}, "rename column", d(4))
    return tmp_path


def test_history_parsing(repo):
    commits = read_history(str(repo))
    assert [c.subject for c in commits] == ["initial", "add column", "fix wrong column type", "rename column"]
    assert commits[2].is_fix and not commits[1].is_fix
    assert sorted(commits[1].files) == ["app/models.py", "app/schema.sql"] and commits[1].lines == 3  # models.py +1 -1, schema.sql +1


def test_cochange_support_and_confidence(repo):
    idx = CoChangeIndex(read_history(str(repo)))
    p = idx.partners("app/models.py")
    assert [(x.path, x.support) for x in p][0] == ("app/schema.sql", 3)
    assert p[0].confidence == pytest.approx(3 / 4)
    assert p[0].example_subject == "rename column"


def test_dependency_graph_direct_and_indirect(repo):
    files = ["app/models.py", "app/service.py", "tests/test_service.py"]
    g = DepGraph(str(repo), files)
    deps = g.dependents_of(["app/models.py"])
    assert deps["app/service.py"][0] == 1 and deps["tests/test_service.py"][0] == 2
    assert is_test_file("tests/test_service.py") and not is_test_file("app/service.py")


def test_risk_evidence_names_the_missing_cochange(repo):
    commits = read_history(str(repo))
    g = DepGraph(str(repo), ["app/models.py", "app/service.py", "tests/test_service.py"])
    r = analyze([ChangedFile("app/models.py", 3, 1)], CoChangeIndex(commits), g)
    assert r["missing_cochanges"][0]["path"] == "app/schema.sql" and r["missing_cochanges"][0]["support"] == 3
    assert "tests/test_service.py" in r["affected_tests"]
    assert any(m["path"] == "app/service.py" for m in r["affected_modules"])
    f = {x["name"]: x for x in r["factors"]}
    assert f["missing_cochange"]["value"] == 25 and "schema.sql" in f["missing_cochange"]["evidence"][0]
    assert r["risk_score"] == pytest.approx(sum(x["contribution"] for x in r["factors"]), abs=0.2)
    # including the partner removes the warning
    r2 = analyze([ChangedFile("app/models.py"), ChangedFile("app/schema.sql")], CoChangeIndex(commits), g)
    assert r2["missing_cochanges"] == []


def test_new_file_has_no_history_and_says_so(repo):
    r = analyze([ChangedFile("brand_new.py", 10, 0)], CoChangeIndex(read_history(str(repo))), DepGraph(str(repo), []))
    f = {x["name"]: x for x in r["factors"]}
    assert f["churn"]["value"] == 0 and "no earlier history" in f["churn"]["evidence"][0]


def test_unparseable_python_is_skipped_not_fatal(tmp_path):
    (tmp_path / "bad.py").write_text("def (:\n")
    (tmp_path / "ok.py").write_text("import bad\n")
    g = DepGraph(str(tmp_path), ["bad.py", "ok.py"])
    assert g.dependents_of(["bad.py"])["ok.py"][0] == 1


def test_evaluate_refuses_without_enough_data(repo):
    out = ev.evaluate_repo(str(repo))
    assert out["status"] == "insufficient_data" and "auc_combined" not in out


def test_evaluate_mechanics_on_synthetic_history(tmp_path):
    # Mechanics only: this synthetic history says nothing about real predictive power.
    import datetime as dt

    git(tmp_path, "init", "-q", "-b", "main")
    t = dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc)
    stream = []
    for i in range(300):
        fix = i % 5 == 4
        if fix:
            files = {f"m{(i * 7) % 40}.py": f"v={i}\n"}
        else:
            files = {f"m{i % 40}.py": f"v={i}\n", f"m{(i + 1) % 40}.py": f"w={i}\n"} if i % 3 else {f"m{i % 40}.py": f"v={i}\n"}
        msg = "fix bug in module" if fix else f"change {i}"
        ts = int((t + dt.timedelta(days=i / 2)).timestamp())
        stream.append(f"commit refs/heads/main\ncommitter t <t@x> {ts} +0000\ndata {len(msg)}\n{msg}\n")
        for name, body in files.items():
            stream.append(f"M 100644 inline {name}\ndata {len(body)}\n{body}\n")
    subprocess.run(["git", "-C", str(tmp_path), "fast-import", "--quiet"], input="".join(stream), text=True, check=True, env=ENV)
    git(tmp_path, "checkout", "-q", "-f", "main")
    out = ev.evaluate_repo(str(tmp_path), bootstrap=50)
    assert out["status"] == "ok" and out["labeled_commits"] >= 100, out
    for k in ("auc_size_only", "auc_combined", "auc_heuristic_score"):
        assert 0.0 <= out[k] <= 1.0
    assert len(out["auc_gain_combined_vs_size_only_95ci"]) == 2
