import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_github_client, get_repo_for_user, org_ids
from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.integrations.github import GitHubClient, GitHubError
from app.models import Repository, User
from app.services import audit
from app.services.sync import sync_repository

router = APIRouter(prefix="/api/v1/repositories", tags=["repositories"])


class ConnectRequest(BaseModel):
    full_name: str


def _out(r: Repository) -> dict:
    return {"id": str(r.id), "full_name": r.full_name, "github_repo_id": r.github_repo_id}


@router.get("")
def list_repositories(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Repository).where(Repository.organization_id.in_(org_ids(user, db))))
    return [_out(r) for r in rows]


@router.get("/available")
def available_repositories(_: User = Depends(current_user), gh: GitHubClient = Depends(get_github_client)):
    """Repositories the user could connect (from GitHub)."""
    try:
        return [{"github_repo_id": r["id"], "full_name": r["full_name"]} for r in gh.list_user_repos()]
    except GitHubError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/connect", status_code=201)
def connect_repository(
    body: ConnectRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    gh: GitHubClient = Depends(get_github_client),
):
    try:
        info = gh.get_repo(body.full_name)
    except GitHubError as e:
        raise HTTPException(status_code=404, detail=str(e))
    ids = org_ids(user, db)
    existing = db.scalar(select(Repository).where(Repository.github_repo_id == info["id"]))
    if existing:
        if existing.organization_id not in ids:
            raise HTTPException(status_code=409, detail="Repository already connected to another organization")
        return _out(existing)
    repo = Repository(organization_id=ids[0], github_repo_id=info["id"], full_name=info["full_name"])
    db.add(repo)
    db.flush()
    audit.record(db, user.id, repo.organization_id, "repository.connect", "repository", repo.id)
    db.commit()
    return _out(repo)


@router.post("/{repo_id}/sync", dependencies=[Depends(rate_limit("sync"))])
def sync(
    repo_id: uuid.UUID,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    gh: GitHubClient = Depends(get_github_client),
):
    repo = get_repo_for_user(repo_id, user, db)
    audit.record(db, user.id, repo.organization_id, "repository.sync", "repository", repo.id)
    try:
        return sync_repository(db, gh, repo)  # runs inline for now; moves to a background worker later
    except GitHubError as e:
        raise HTTPException(status_code=502, detail=str(e))
