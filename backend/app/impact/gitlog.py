import re
import subprocess
from dataclasses import dataclass, field

# Heuristic: a commit subject that looks like a bug fix. Imperfect; documented in docs/impact.md.
FIX_RE = re.compile(r"\b(fix(e[sd])?|bug|hotfix|regression|crash|patch)\b", re.IGNORECASE)
SEP = "\x1e"


@dataclass
class Commit:
    sha: str
    author: str
    ts: int
    subject: str
    files: list[str] = field(default_factory=list)
    lines: int = 0

    @property
    def is_fix(self) -> bool:
        return bool(FIX_RE.search(self.subject))


def run_git(path: str, *args: str, timeout: int = 120) -> str:
    out = subprocess.run(["git", "-C", path, *args], capture_output=True, text=True, timeout=timeout, check=True)
    return out.stdout


def read_history(path: str, max_commits: int = 2000) -> list[Commit]:
    """Non-merge commits, oldest first. Renames are reported as delete + add (--no-renames) to keep paths simple."""
    raw = run_git(path, "log", "--no-merges", "--no-renames", "--numstat", f"--max-count={max_commits}",
                  f"--format={SEP}%H%x1f%an%x1f%ct%x1f%s")
    commits: list[Commit] = []
    for block in raw.split(SEP):
        if not block.strip():
            continue
        head, _, rest = block.partition("\n")
        sha, author, ts, subject = head.split("\x1f", 3)
        c = Commit(sha=sha, author=author, ts=int(ts), subject=subject)
        for line in rest.splitlines():
            parts = line.split("\t")
            if len(parts) != 3:
                continue
            add, dele, name = parts
            c.files.append(name)
            c.lines += (int(add) if add.isdigit() else 0) + (int(dele) if dele.isdigit() else 0)
        commits.append(c)
    commits.reverse()
    return commits
