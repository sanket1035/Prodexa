from collections import Counter, defaultdict
from dataclasses import dataclass
from itertools import combinations

from app.impact.gitlog import Commit

MAX_FILES_PER_COMMIT = 40  # larger commits (mass renames, formatting) say nothing about files that belong together


@dataclass
class Partner:
    path: str
    support: int  # commits where both files changed
    confidence: float  # support / commits that changed the source file
    example_sha: str
    example_subject: str


class CoChangeIndex:
    """Counts of file changes, bug-fix changes and file pairs changed together. Built incrementally with add()."""

    def __init__(self, commits: list[Commit] | None = None):
        self.file_commits: Counter[str] = Counter()
        self.fix_commits: Counter[str] = Counter()
        self._nbrs: dict[str, Counter[str]] = defaultdict(Counter)
        self._example: dict[tuple[str, str], Commit] = {}
        for c in commits or []:
            self.add(c)

    def add(self, c: Commit) -> None:
        files = sorted(set(c.files))
        for f in files:
            self.file_commits[f] += 1
            if c.is_fix:
                self.fix_commits[f] += 1
        if len(files) > MAX_FILES_PER_COMMIT:
            return
        for a, b in combinations(files, 2):
            self._nbrs[a][b] += 1
            self._nbrs[b][a] += 1
            self._example[(a, b)] = c  # keeps the most recent example (commits are added oldest-first)

    def partners(self, path: str, min_support: int = 2, min_confidence: float = 0.3) -> list[Partner]:
        total = self.file_commits.get(path, 0)
        out = []
        for other, n in self._nbrs.get(path, {}).items():
            conf = n / total if total else 0.0
            if n >= min_support and conf >= min_confidence:
                ex = self._example[tuple(sorted((path, other)))]
                out.append(Partner(other, n, round(conf, 3), ex.sha[:8], ex.subject))
        return sorted(out, key=lambda p: (-p.confidence, -p.support, p.path))
