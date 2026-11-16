from collections.abc import Iterator
from typing import Any

import httpx

from app.core.config import settings


class GitHubError(Exception):
    pass


class GitHubClient:
    """Thin GitHub REST client. Follows pagination; raises GitHubError on API failures."""

    def __init__(self, token: str, transport: httpx.BaseTransport | None = None):
        self._http = httpx.Client(
            base_url=settings.github_api_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            transport=transport,
            timeout=20,
        )

    def _paginate(self, path: str, params: dict[str, Any] | None = None) -> Iterator[dict]:
        url: str | None = path
        params = {"per_page": 100, **(params or {})}
        while url:
            r = self._http.get(url, params=params)
            if r.status_code == 403 and r.headers.get("x-ratelimit-remaining") == "0":
                raise GitHubError("GitHub rate limit exceeded")
            if r.status_code >= 400:
                raise GitHubError(f"GitHub API error {r.status_code} for {path}")
            yield from r.json()
            url = r.links.get("next", {}).get("url")
            params = None  # the next URL already carries its query string

    def get_repo(self, full_name: str) -> dict:
        r = self._http.get(f"/repos/{full_name}")
        if r.status_code >= 400:
            raise GitHubError(f"GitHub API error {r.status_code} for repo {full_name}")
        return r.json()

    def list_user_repos(self) -> Iterator[dict]:
        return self._paginate("/user/repos", {"sort": "updated"})

    def list_issues(self, full_name: str) -> Iterator[dict]:
        # This endpoint returns pull requests too; callers must skip items with "pull_request".
        return self._paginate(f"/repos/{full_name}/issues", {"state": "all"})

    def list_pulls(self, full_name: str) -> Iterator[dict]:
        return self._paginate(f"/repos/{full_name}/pulls", {"state": "all"})


def exchange_code_for_token(code: str, transport: httpx.BaseTransport | None = None) -> str:
    with httpx.Client(transport=transport, timeout=20) as c:
        r = c.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
        )
    token = r.json().get("access_token") if r.status_code == 200 else None
    if not token:
        raise GitHubError("OAuth code exchange failed")
    return token
