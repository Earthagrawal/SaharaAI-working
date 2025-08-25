from __future__ import annotations

import os
import sys
import redis


def main() -> int:
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    dim = int(os.getenv("REDIS_VECTOR_DIM", "128"))
    r = redis.from_url(redis_url)
    try:
        info = r.execute_command("FT._LIST")
    except Exception:
        info = []
    if b"kb:idx" in info:
        print("Index kb:idx already exists")
        return 0
    # Create vector index
    try:
        # RediSearch HNSW VECTOR: pass args as pairs count (number after HNSW)
        r.execute_command(
            "FT.CREATE",
            "kb:idx",
            "ON",
            "HASH",
            "SCHEMA",
            "text",
            "TEXT",
            "embedding",
            "VECTOR",
            "HNSW",
            "12",
            "TYPE",
            "FLOAT32",
            "DIM",
            str(dim),
            "DISTANCE_METRIC",
            "COSINE",
            "INITIAL_CAP",
            "1000",
            "M",
            "16",
            "EF_RUNTIME",
            "10",
        )
        print("Index kb:idx created")
        return 0
    except Exception as e:
        print(f"Failed to create index: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())


