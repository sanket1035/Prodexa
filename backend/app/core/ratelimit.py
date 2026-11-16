"""Fixed-window rate limiter kept in process memory.

Good enough to stop accidental hammering of expensive endpoints on one server. It is NOT shared across
processes or restarts; behind several workers, use a Redis-backed limiter instead.
"""
import threading
import time

from fastapi import HTTPException, Request

from app.core.config import settings

_lock = threading.Lock()
_hits: dict[tuple[str, str], tuple[int, int]] = {}  # (bucket, key) -> (window, count)


def reset() -> None:
    with _lock:
        _hits.clear()


def rate_limit(bucket: str):
    def dep(request: Request) -> None:
        key = request.session.get("user_id") or (request.client.host if request.client else "anon")
        window = int(time.time() // 60)
        with _lock:
            w, n = _hits.get((bucket, key), (window, 0))
            n = n + 1 if w == window else 1
            _hits[(bucket, key)] = (window, n)
        if n > settings.rate_limit_per_minute:
            raise HTTPException(status_code=429, detail="Too many requests",
                                headers={"Retry-After": str(60 - int(time.time() % 60))})

    return dep
