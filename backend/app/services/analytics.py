"""Engineering metrics, each a plain SQL aggregate over synced data. Definitions live in docs/analytics.md."""
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.ml.classification import weak_label

DAY = 86400.0


def overview(db: Session, repo_id: uuid.UUID) -> dict:
    p = {"r": repo_id}
    counts = db.execute(text(
        "SELECT count(*) FILTER (WHERE state='open') AS open_n, count(*) FILTER (WHERE state='closed') AS closed_n,"
        " avg(extract(epoch FROM now() - created_at)) FILTER (WHERE state='open')/:d AS avg_open_age_days "
        "FROM issues WHERE repository_id=:r").bindparams(d=DAY), p).one()
    res = db.execute(text(
        "SELECT count(*) AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM closed_at - created_at))/:d AS med "
        "FROM issues WHERE repository_id=:r AND state='closed' AND closed_at IS NOT NULL").bindparams(d=DAY), p).one()
    pr = db.execute(text(
        "SELECT count(*) AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM merged_at - created_at))/:d AS med "
        "FROM pull_requests WHERE repository_id=:r AND merged_at IS NOT NULL").bindparams(d=DAY), p).one()
    r = lambda v: None if v is None else round(float(v), 2)  # noqa: E731
    return {
        "open_issues": counts.open_n, "closed_issues": counts.closed_n,
        "avg_open_issue_age_days": r(counts.avg_open_age_days),
        "resolved_issues": res.n, "median_resolution_days": r(res.med),
        "merged_pull_requests": pr.n, "median_pr_cycle_days": r(pr.med),
    }


def issue_trends(db: Session, repo_id: uuid.UUID, weeks: int) -> dict:
    p = {"r": repo_id, "w": weeks}
    weekly = db.execute(text(
        "WITH w AS (SELECT generate_series(date_trunc('week', now()) - make_interval(weeks => :w - 1),"
        " date_trunc('week', now()), interval '1 week') AS start) "
        "SELECT w.start::date AS week,"
        " (SELECT count(*) FROM issues i WHERE i.repository_id=:r AND date_trunc('week', i.created_at)=w.start) AS opened,"
        " (SELECT count(*) FROM issues i WHERE i.repository_id=:r AND i.closed_at IS NOT NULL"
        "   AND date_trunc('week', i.closed_at)=w.start) AS closed "
        "FROM w ORDER BY w.start"), p).all()
    label_rows = db.execute(text("SELECT labels FROM issues WHERE repository_id=:r"), p).all()
    cats: dict[str, int] = {}
    for (labels,) in label_rows:
        cats[weak_label(labels or []) or "uncategorized"] = cats.get(weak_label(labels or []) or "uncategorized", 0) + 1
    contrib = db.execute(text(
        "SELECT login, sum(issues) AS issues, sum(prs) AS prs, sum(merged) AS merged FROM ("
        " SELECT author_login AS login, count(*) AS issues, 0 AS prs, 0 AS merged FROM issues"
        "  WHERE repository_id=:r AND author_login IS NOT NULL GROUP BY 1"
        " UNION ALL SELECT author_login, 0, count(*), count(merged_at) FROM pull_requests"
        "  WHERE repository_id=:r AND author_login IS NOT NULL GROUP BY 1) t "
        "GROUP BY login ORDER BY sum(issues)+sum(prs) DESC, login LIMIT 10"), p).all()
    return {
        "weekly": [{"week": str(x.week), "opened": x.opened, "closed": x.closed} for x in weekly],
        "categories": dict(sorted(cats.items(), key=lambda kv: (-kv[1], kv[0]))),
        "contributors": [{"login": x.login, "issues_opened": int(x.issues), "prs_opened": int(x.prs),
                          "prs_merged": int(x.merged)} for x in contrib],
    }
