# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

FROM base AS runtime
RUN useradd -u 10001 -m appuser
USER appuser
WORKDIR /app
COPY . /app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -fsS http://localhost:8000/healthz || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


