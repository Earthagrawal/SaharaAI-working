## Sahara Youth Mental Wellness

Empathetic, confidential mental wellness assistant for youth. Docker-first, FastAPI backend, React + Vite frontend, Redis vector KB, offline MOCK_MODE.

```
Architecture

[Browser]
  | HTTP(S)
  v
[Frontend (Vite/React) + Nginx]
  | REST/audio upload
  v
[Backend (FastAPI, SaharaConvoGraph)] ----> [Vertex AI (Gemma/Embeddings)]
         |                                   [STT/TTS]
         +----> [Redis RediSearch kb:idx]
         +----> /metrics (Prometheus)
```

### Repository Structure

```
sahara-youth-mental-wellness/
  backend/
    app/
      graph/sahara.py
      prompt/system_prompt.txt
      routers/{todo.py,turn.py}
      main.py
    scripts/{create_index.py,seed_kb.py}
    tests/{test_health.py,test_todo.py,test_turn.py}
    Dockerfile
    requirements.txt
  frontend/
    src/{main.tsx,index.css}
    index.html
    package.json
    vite.config.ts
    tailwind.config.js
    postcss.config.js
    Dockerfile
    nginx.conf
  docker-compose.yml
  docker-compose.prod.yml
  .github/workflows/ci.yml
  .env.example
  README.md
```

### Prerequisites

- Docker and Docker Compose
- Optional: GCP project + service account for Vertex/STT/TTS

### GCP setup (production)

- Create a service account and assign roles: roles/aiplatform.user, roles/storage.objectAdmin, roles/texttospeech.admin, roles/speech.admin, roles/secretmanager.secretAccessor.
- Mount credentials and set `GOOGLE_APPLICATION_CREDENTIALS` env var (path inside container).

### Redis Vector Index

- Run: `docker compose run --rm admin` or `python backend/scripts/create_index.py` with envs.
- In prose: The FT.CREATE command uses VECTOR HNSW TYPE FLOAT32 DIM equal to `REDIS_VECTOR_DIM` with DISTANCE_METRIC COSINE and sensible INITIAL_CAP and M values, e.g., VECTOR HNSW TYPE FLOAT32 DIM $REDIS_VECTOR_DIM DISTANCE_METRIC COSINE INITIAL_CAP 1000 M 16.

### Development

1. Copy `.env.example` to `.env` and set values (keep MOCK_MODE=true for local).
2. Start: `docker-compose up --build`.
3. Backend: http://localhost:8000/healthz
4. Tests: `docker compose exec backend pytest -q` or locally in venv.
5. Seed KB: `docker compose exec backend python scripts/seed_kb.py --kb_path "/workspace/SaharaAI database to be put integrated/mental_wellness_docs"` adjusting the path as needed.

### Production build & deploy (prose example)

- Build images: `docker build -t REG/sahara-backend:latest backend` and `docker build -t REG/sahara-frontend:latest frontend`.
- Push images and deploy to Cloud Run with appropriate env vars (APP_ENV=production, MOCK_MODE=false, REDIS_URL, VERTEX_MODEL, VERTEX_EMBEDDING_MODEL, MAX_OUTPUT_TOKENS, GOOGLE_APPLICATION_CREDENTIALS) and the service account above.

### Tests & CI

- Pytest covers health, todo CRUD, and mocked /turn. CI lints, tests, and builds images on pushes/PRs.

### Troubleshooting

- Redis errors: check REDIS_URL and that the container is healthy.
- Vertex permission errors: verify IAM roles and credentials mapping.
- STT/TTS quotas: use MOCK_MODE=true for local dev.

### Privacy & Safety

- Structured JSON logs with PII redaction (emails/phones). No raw PII logged.
- Crisis guidance provided in replies when needed; no diagnoses.

### License & Contributing

MIT License. PRs welcome.


