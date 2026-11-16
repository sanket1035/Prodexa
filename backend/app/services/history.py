"""Local clones of connected repositories, used for change impact analysis (git history + source files)."""
import re
import subprocess
from pathlib import Path

from app.core.config import settings
from app.impact.gitlog import run_git

_NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


def history_path(full_name: str) -> Path:
    if not _NAME.match(full_name) or ".." in full_name:
        raise ValueError("Invalid repository name")
    return Path(settings.workspace_dir) / full_name.replace("/", "__")


def _git(*args: str, cwd: str | None = None, timeout: int = 600) -> None:
    # Hooks are disabled and only the configured base URL is cloned. Repository code is never executed.
    cmd = ["git", "-c", "core.hooksPath=/dev/null", "-c", "protocol.ext.allow=never", *args]
    subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True, timeout=timeout)


def ensure_history(full_name: str) -> dict:
    """Clone (shallow, limited depth) or update the repository and return the commit count available."""
    path = history_path(full_name)
    depth = str(settings.history_depth)
    if (path / ".git").exists():
        _git("fetch", "--depth", depth, "origin", cwd=str(path))
        _git("checkout", "-q", "--force", "FETCH_HEAD", cwd=str(path))
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        _git("clone", "--depth", depth, "--no-tags", "--quiet", f"{settings.git_base_url}/{full_name}", str(path))
    return {"commits": int(run_git(str(path), "rev-list", "--count", "HEAD").strip()), "depth": settings.history_depth}
