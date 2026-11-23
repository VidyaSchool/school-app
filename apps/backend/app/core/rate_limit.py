import time
import asyncio
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, List[float]] = {}
        self._lock = asyncio.Lock()
        self._cleanup_task = None

    def _ensure_cleanup(self):
        if self._cleanup_task is None or self._cleanup_task.done():
            try:
                loop = asyncio.get_running_loop()
                self._cleanup_task = loop.create_task(self._cleanup_loop())
            except RuntimeError:
                pass

    async def _cleanup_loop(self):
        while True:
            await asyncio.sleep(300)  # Clean up every 5 minutes
            now = time.time()
            async with self._lock:
                to_delete = []
                for key, timestamps in self._requests.items():
                    valid = [ts for ts in timestamps if now - ts < 60]
                    if valid:
                        self._requests[key] = valid
                    else:
                        to_delete.append(key)
                for key in to_delete:
                    del self._requests[key]

    async def check(self, key: str, limit: int, window: int = 60) -> Tuple[bool, int, int]:
        self._ensure_cleanup()
        now = time.time()
        async with self._lock:
            timestamps = self._requests.get(key, [])
            valid_timestamps = [ts for ts in timestamps if now - ts < window]

            if len(valid_timestamps) >= limit:
                oldest = valid_timestamps[0]
                reset_seconds = int(max(1, (oldest + window) - now))
                self._requests[key] = valid_timestamps
                return False, 0, reset_seconds

            valid_timestamps.append(now)
            self._requests[key] = valid_timestamps
            remaining = limit - len(valid_timestamps)
            reset_seconds = int(window)
            return True, remaining, reset_seconds


rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.headers.get("x-real-ip") or (
                request.client.host if request.client else "127.0.0.1"
            )

        path = request.url.path

        # Determine limits based on path category
        if path.startswith("/api/qr-auth") or path.startswith("/api/sessions") or path.startswith("/notify"):
            limit = 60  # Strict rate limit for auth & notification endpoints
            category = "strict"
        elif path.startswith("/health") or path.startswith("/api/health"):
            limit = 300  # High limit for health checks
            category = "health"
        else:
            limit = 180  # Standard rate limit for general API endpoints
            category = "general"

        key = f"{client_ip}:{category}"
        allowed, remaining, reset_sec = await rate_limiter.check(key, limit=limit, window=60)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later.", "retry_after": reset_sec},
                headers={
                    "Retry-After": str(reset_sec),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_sec),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_sec)
        return response
