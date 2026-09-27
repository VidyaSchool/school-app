import os
import json
import time
import logging
from typing import Optional, Any, Dict, Tuple

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# In-memory fallback cache: key -> (expire_at_timestamp, json_string)
_memory_cache: Dict[str, Tuple[float, str]] = {}
_redis_client = None
_redis_available = None

def get_redis_client():
    global _redis_client, _redis_available
    if _redis_client is not None and _redis_available is True:
        return _redis_client

    try:
        import redis
        client = redis.from_url(
            REDIS_URL,
            socket_timeout=1.5,
            socket_connect_timeout=1.5,
            decode_responses=True
        )
        client.ping()
        _redis_client = client
        _redis_available = True
        logger.info("[Cache] Connected to Redis successfully.")
        return _redis_client
    except Exception as e:
        _redis_available = False
        _redis_client = None
        # logger.debug(f"[Cache] Redis not available, using high-speed in-memory cache: {e}")
        return None

def is_redis_online() -> bool:
    return get_redis_client() is not None

def get_cache(key: str) -> Optional[Any]:
    """Retrieve item from Redis, with transparent fallback to in-memory cache."""
    client = get_redis_client()
    if client:
        try:
            val = client.get(key)
            if val is not None:
                try:
                    return json.loads(val)
                except Exception:
                    return val
            return None
        except Exception as e:
            logger.warning(f"[Cache] Redis GET error for {key}: {e}")

    # Fallback to in-memory
    if key in _memory_cache:
        expire_at, val = _memory_cache[key]
        if time.time() < expire_at:
            try:
                return json.loads(val)
            except Exception:
                return val
        else:
            del _memory_cache[key]
    return None

def set_cache(key: str, value: Any, ttl: int = 86400) -> bool:
    """Store item in Redis with TTL (default 24h), with in-memory fallback."""
    serialized = json.dumps(value) if not isinstance(value, str) else value
    success = False

    client = get_redis_client()
    if client:
        try:
            client.setex(key, ttl, serialized)
            success = True
        except Exception as e:
            logger.warning(f"[Cache] Redis SET error for {key}: {e}")

    # Always update in-memory cache too for maximum resilience
    _memory_cache[key] = (time.time() + ttl, serialized)
    return success or True

def delete_cache(key: str) -> bool:
    """Delete a key from Redis and in-memory cache."""
    _memory_cache.pop(key, None)
    client = get_redis_client()
    if client:
        try:
            client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"[Cache] Redis DELETE error for {key}: {e}")
    return True

def delete_pattern(pattern: str) -> int:
    """Delete keys matching pattern (e.g. 'book:*')."""
    # Clear matching memory keys
    import fnmatch
    to_delete = [k for k in _memory_cache if fnmatch.fnmatch(k, pattern)]
    for k in to_delete:
        _memory_cache.pop(k, None)

    count = len(to_delete)
    client = get_redis_client()
    if client:
        try:
            keys = client.keys(pattern)
            if keys:
                client.delete(*keys)
                count += len(keys)
        except Exception as e:
            logger.warning(f"[Cache] Redis DELETE pattern error for {pattern}: {e}")
    return count

# ── Specialized Book & Library Cache Helpers ──────────────────────────────

def normalize_isbn(isbn: str) -> str:
    """Normalize ISBN by stripping dashes, spaces, and converting to uppercase."""
    import re
    return re.sub(r'[^0-9X]', '', (isbn or '').upper())

def get_cached_book_by_isbn(isbn: str) -> Optional[dict]:
    clean = normalize_isbn(isbn)
    return get_cache(f"book:isbn:{clean}")

def set_cached_book_by_isbn(isbn: str, book_data: dict, ttl: int = 86400):
    clean = normalize_isbn(isbn)
    set_cache(f"book:isbn:{clean}", book_data, ttl=ttl)

def get_cached_book_by_title(title: str) -> Optional[dict]:
    norm = (title or '').strip().lower()
    return get_cache(f"book:title:{norm}")

def set_cached_book_by_title(title: str, book_data: dict, ttl: int = 86400):
    norm = (title or '').strip().lower()
    set_cache(f"book:title:{norm}", book_data, ttl=ttl)

def invalidate_books_cache():
    delete_cache("books:all")
    delete_cache("books:available")
    delete_pattern("books:search:*")
