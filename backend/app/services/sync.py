from datetime import datetime

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.integrations.github import GitHubClient
from app.models import Issue, PullRequest


def _ts(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def upsert_issue(db: Session, repository_id, item: dict) -> None:
    stmt = insert(Issue).values(
        repository_id=repository_id,
        github_issue_id=item["id"],
        title=item["title"],
        body=item.get("body"),
        state=item["state"],
        created_at=_ts(item["created_at"]),
        closed_at=_ts(item.get("closed_at")),
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["repository_id", "github_issue_id"],
        set_={"title": stmt.excluded.title, "body": stmt.excluded.body,
              "state": stmt.excluded.state, "closed_at": stmt.excluded.closed_at},
    )
    db.execute(stmt)


def upsert_pr(db: Session, repository_id, item: dict) -> None:
    stmt = insert(PullRequest).values(
        repository_id=repository_id,
        github_pr_id=item["id"],
        state=item["state"],
        created_at=_ts(item["created_at"]),
        merged_at=_ts(item.get("merged_at")),
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["repository_id", "github_pr_id"],
        set_={"state": stmt.excluded.state, "merged_at": stmt.excluded.merged_at},
    )
    db.execute(stmt)


def sync_repository(db: Session, client: GitHubClient, repository) -> dict[str, int]:
    """Full import. Safe to run repeatedly: rows are upserted by GitHub id."""
    issues = prs = 0
    for item in client.list_issues(repository.full_name):
        if "pull_request" in item:
            continue
        upsert_issue(db, repository.id, item)
        issues += 1
    for item in client.list_pulls(repository.full_name):
        upsert_pr(db, repository.id, item)
        prs += 1
    db.commit()
    return {"issues": issues, "pull_requests": prs}
