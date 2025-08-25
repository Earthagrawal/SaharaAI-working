from __future__ import annotations

import argparse
import os
import pathlib
import redis


def add_doc(r: redis.Redis, doc_id: str, text: str, meta: dict) -> None:
    key = f"kb:doc:{doc_id}"
    r.hset(key, mapping={"text": text, "meta": str(meta)})


def walk_and_seed(base: str, redis_url: str) -> None:
    r = redis.from_url(redis_url)
    base_path = pathlib.Path(base)
    for p in base_path.rglob("*.txt"):
        doc_id = p.relative_to(base_path).as_posix()
        text = p.read_text(encoding="utf-8")
        add_doc(r, doc_id, text, {"path": doc_id})
        print(f"Seeded {doc_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--kb_path", default=os.getenv("KB_PATH", "/kb"))
    parser.add_argument("--redis_url", default=os.getenv("REDIS_URL", "redis://redis:6379/0"))
    args = parser.parse_args()
    walk_and_seed(args.kb_path, args.redis_url)


