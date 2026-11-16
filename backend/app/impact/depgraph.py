"""Static import graph for Python files. Parses source text with `ast`; never imports or runs repository code."""
import ast
import os
from collections import defaultdict, deque

MAX_FILE_BYTES = 500_000


def is_test_file(path: str) -> bool:
    parts = path.split("/")
    name = parts[-1]
    return "tests" in parts[:-1] or "test" in parts[:-1] or name.startswith("test_") or name.endswith("_test.py")


def _module_names(path: str) -> list[str]:
    """Every dotted suffix a file could be imported as, e.g. backend/app/x.py -> app.x, x (and backend.app.x)."""
    stem = path[:-3] if path.endswith(".py") else path
    parts = stem.split("/")
    if parts[-1] == "__init__":
        parts = parts[:-1]
    return [".".join(parts[i:]) for i in range(len(parts)) if parts[i:]]


class DepGraph:
    def __init__(self, root: str, files: list[str]):
        self.files = [f for f in files if f.endswith(".py")]
        by_name: dict[str, set[str]] = defaultdict(set)
        for f in self.files:
            for name in _module_names(f):
                by_name[name].add(f)
        self._by_name = {n: next(iter(fs)) for n, fs in by_name.items() if len(fs) == 1}  # ambiguous names are skipped
        self.imports: dict[str, set[str]] = defaultdict(set)
        self.dependents: dict[str, set[str]] = defaultdict(set)
        for f in self.files:
            for target in self._edges(root, f):
                if target != f:
                    self.imports[f].add(target)
                    self.dependents[target].add(f)

    def _resolve(self, dotted: str) -> str | None:
        return self._by_name.get(dotted)

    def _edges(self, root: str, path: str) -> set[str]:
        full = os.path.join(root, path)
        try:
            if os.path.getsize(full) > MAX_FILE_BYTES:
                return set()
            tree = ast.parse(open(full, encoding="utf-8", errors="replace").read())
        except (OSError, SyntaxError, ValueError):
            return set()
        pkg = path.split("/")[:-1]
        out: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for a in node.names:
                    t = self._resolve(a.name)
                    if t:
                        out.add(t)
            elif isinstance(node, ast.ImportFrom):
                if node.level:
                    base = pkg[: len(pkg) - (node.level - 1)] if node.level - 1 <= len(pkg) else []
                    mod = ".".join(base + ([node.module] if node.module else []))
                else:
                    mod = node.module or ""
                for a in node.names:
                    t = self._resolve(f"{mod}.{a.name}" if mod else a.name) or (self._resolve(mod) if mod else None)
                    if t:
                        out.add(t)
        return out

    def dependents_of(self, paths: list[str], depth: int = 2) -> dict[str, tuple[int, str]]:
        """Files that import any of `paths`, directly or through up to `depth` hops: {file: (hops, via)}."""
        seen: dict[str, tuple[int, str]] = {}
        queue = deque((p, 0, p) for p in paths)
        while queue:
            cur, d, origin = queue.popleft()
            if d == depth:
                continue
            for dep in sorted(self.dependents.get(cur, ())):
                if dep not in seen and dep not in paths:
                    seen[dep] = (d + 1, origin)
                    queue.append((dep, d + 1, origin))
        return seen
