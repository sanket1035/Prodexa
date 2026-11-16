import uuid

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.crypto import decrypt
from app.db.session import get_db
from app.integrations.github import GitHubClient
from app.models import GithubAccount, Membership, Repository, User


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    uid = request.session.get("user_id")
    user = db.get(User, uuid.UUID(uid)) if uid else None
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def github_client_for(user: User, db: Session) -> GitHubClient:
    acct = db.get(GithubAccount, user.id)
    if acct is None:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    return GitHubClient(decrypt(acct.access_token_enc))


def get_github_client(user: User = Depends(current_user), db: Session = Depends(get_db)) -> GitHubClient:
    # Tests override this dependency to inject a fake GitHub transport.
    return github_client_for(user, db)


def org_ids(user: User, db: Session) -> list[uuid.UUID]:
    return list(db.scalars(select(Membership.organization_id).where(Membership.user_id == user.id)))


def get_repo_for_user(repo_id: uuid.UUID, user: User, db: Session) -> Repository:
    """Authorization boundary: a repository is only visible to members of its organization.
    Returns 404 (not 403) so other tenants' repository ids are not revealed."""
    repo = db.get(Repository, repo_id)
    if repo is None or repo.organization_id not in org_ids(user, db):
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo
