import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.config import settings
from app.core.crypto import encrypt
from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.integrations.github import GitHubError, exchange_code_for_token
from app.models import GithubAccount, Membership, Organization, User
from app.services import audit

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/github/login", dependencies=[Depends(rate_limit("login"))])
def github_login(request: Request):
    state = secrets.token_urlsafe(24)
    request.session["oauth_state"] = state
    query = urlencode({"client_id": settings.github_client_id, "scope": "read:user public_repo", "state": state})
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{query}")


def _fetch_github_user(token: str) -> dict:
    r = httpx.get("https://api.github.com/user", headers={"Authorization": f"Bearer {token}"}, timeout=20)
    if r.status_code != 200:
        raise GitHubError("Could not read GitHub profile")
    return r.json()


@router.get("/github/callback", dependencies=[Depends(rate_limit("login"))])
def github_callback(request: Request, code: str, state: str, db: Session = Depends(get_db)):
    expected = request.session.pop("oauth_state", None)
    if not expected or not secrets.compare_digest(expected, state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    try:
        token = exchange_code_for_token(code)
        profile = _fetch_github_user(token)
    except GitHubError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    user = db.scalar(select(User).where(User.github_user_id == profile["id"]))
    if user is None:
        email = profile.get("email") or f"{profile['login']}@users.noreply.github.com"
        user = User(email=email, github_user_id=profile["id"], github_login=profile["login"])
        db.add(user)
        db.flush()
        org = Organization(name=profile["login"], owner_id=user.id)
        db.add(org)
        db.flush()
        db.add(Membership(user_id=user.id, organization_id=org.id, role="owner"))
    acct = db.get(GithubAccount, user.id)
    if acct is None:
        db.add(GithubAccount(user_id=user.id, access_token_enc=encrypt(token)))
    else:
        acct.access_token_enc = encrypt(token)
    first_org = db.scalar(select(Membership.organization_id).where(Membership.user_id == user.id))
    audit.record(db, user.id, first_org, "auth.login", "user", user.id)
    db.commit()
    request.session["user_id"] = str(user.id)
    return RedirectResponse(settings.frontend_url)


@router.get("/me")
def me(user: User = Depends(current_user)):
    return {"id": str(user.id), "github_login": user.github_login}


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "ok"}
