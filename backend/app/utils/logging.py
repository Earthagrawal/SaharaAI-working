from __future__ import annotations

import json
import logging
import re
import sys
from typing import Any, Dict


PII_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PII_PHONE_RE = re.compile(r"\b(?:\+?\d{1,3}[ -]?)?(?:\d{10}|\d{3}[ -]\d{3}[ -]\d{4})\b")


def redact_pii(text: str) -> str:
    text = PII_EMAIL_RE.sub("[redacted_email]", text)
    text = PII_PHONE_RE.sub("[redacted_phone]", text)
    return text


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        payload: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        if hasattr(record, "request_id"):
            payload["request_id"] = getattr(record, "request_id")
        if isinstance(record.args, dict):
            payload.update(record.args)
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def get_logger() -> logging.Logger:
    logger = logging.getLogger("sahara")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


