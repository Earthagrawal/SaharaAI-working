from __future__ import annotations

import os
import time
import uuid
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, Counter, Histogram, generate_latest
from starlette.responses import JSONResponse, PlainTextResponse

from .routers.todo import router as todo_router
from .routers.turn import router as turn_router
from .utils.logging import get_logger


APP_START_TIME = time.time()

registry = CollectorRegistry()
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
    registry=registry,
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "path"],
    registry=registry,
)


def create_app() -> FastAPI:
    app = FastAPI(title="Sahara Youth Mental Wellness Backend")

    # CORS for local dev
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    logger = get_logger()

    @app.middleware("http")
    async def add_request_id_and_metrics(request: Request, call_next: Callable):  # type: ignore[override]
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        start = time.time()
        try:
            response: Response = await call_next(request)
        except Exception as exc:  # pragma: no cover - converted to JSON error
            logger.exception("unhandled_error", extra={"request_id": request_id})
            response = JSONResponse(
                status_code=500,
                content={
                    "error": "internal_error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "request_id": request_id,
                },
            )
        duration = time.time() - start
        path = request.url.path
        REQUEST_COUNT.labels(request.method, path, str(response.status_code)).inc()
        REQUEST_LATENCY.labels(request.method, path).observe(duration)
        response.headers["X-Request-Id"] = request_id
        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "path": path,
                "method": request.method,
                "status": response.status_code,
                "duration_ms": int(duration * 1000),
            },
        )
        return response

    @app.get("/healthz")
    async def healthz():
        return {
            "status": "ok",
            "uptime_s": round(time.time() - APP_START_TIME, 2),
            "env": os.getenv("APP_ENV", "development"),
        }

    @app.get("/metrics")
    async def metrics():
        data = generate_latest(registry)
        return PlainTextResponse(content=data.decode("utf-8"), media_type=CONTENT_TYPE_LATEST)

    app.include_router(todo_router)
    app.include_router(turn_router)

    return app


app = create_app()