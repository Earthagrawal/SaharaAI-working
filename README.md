
## 📁 Repository Structure

```
sahara-youth-mental-wellness/
  backend/
   app/
    graph/
    prompt/
    routers/
    main.py
   scripts/
   tests/
   Dockerfile
   requirements.txt
  frontend/
   src/
   index.html
   package.json
   vite.config.ts
   tailwind.config.js
   postcss.config.js
   Dockerfile
   nginx.conf
  docker-compose.yml
  docker-compose.prod.yml
  .env.example
  README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- (Optional for production) Google Cloud Project + Service Account for Vertex AI, STT, TTS

### Environment Setup
1. Copy `.env.example` to `.env`:
  ```sh
  cp .env.example .env
  ```
2. For local/offline: set `MOCK_MODE=true` (no credentials needed)
3. For production/cloud: set `MOCK_MODE=false` and provide all required credentials

---

## 🧑‍💻 Running the Project

### A. Local Development (No Credentials, MOCK_MODE)

1. Ensure `.env` has `MOCK_MODE=true` (default for local dev)
2. Start all services:
  ```sh
  docker-compose up --build
  ```
3. Access the app:
  - Frontend: http://localhost:3000
              http://localhost:5173
  - Backend health: http://localhost:8000/healthz
4. Run backend tests:
  ```sh
  docker compose exec backend pytest -q
  ```
5. (Optional) Seed the knowledge base:
  ```sh
  docker compose exec backend python scripts/seed_kb.py --kb_path "/workspace/kb/"
  ```

**Features in MOCK_MODE:**
- No cloud credentials required
- All AI, STT, TTS, and vector search are mocked for fast, private local development

---

### B. Full Production/Cloud Mode (With Credentials)

1. Set up a Google Cloud project and create a service account with these roles:
  - `roles/aiplatform.user`
  - `roles/storage.objectAdmin`
  - `roles/texttospeech.admin`
  - `roles/speech.admin`
  - `roles/secretmanager.secretAccessor`
2. Download the service account key JSON and mount it in your deployment environment
3. In your `.env`, set:
  - `MOCK_MODE=false`
  - `GOOGLE_APPLICATION_CREDENTIALS=/path/in/container/credentials.json`
  - All other required cloud/Vertex/Redis variables
4. Build and run:
  ```sh
  docker-compose -f docker-compose.prod.yml up --build
  ```
5. (Optional) Build and push images for cloud deployment:
  ```sh
  docker build -t <REGISTRY>/sahara-backend:latest backend
  docker build -t <REGISTRY>/sahara-frontend:latest frontend
  # Push and deploy as needed
  ```

---

## 🗄️ Redis Vector Index Setup

- To initialize the vector index:
  ```sh
  docker compose run --rm backend python scripts/create_index.py
  ```
- The index uses VECTOR HNSW TYPE FLOAT32 DIM (from `REDIS_VECTOR_DIM`) and COSINE distance.

---

## 🧪 Testing & CI

- Run backend tests: `docker compose exec backend pytest -q`
- CI: Lints, tests, and builds images on every push/PR (see `.github/workflows/ci.yml`)

---

## 🛠️ Troubleshooting

- **Redis errors:** Check `REDIS_URL` and container health
- **Vertex permission errors:** Verify IAM roles and credentials
- **STT/TTS quotas:** Use `MOCK_MODE=true` for local dev

---

## 🔒 Privacy & Safety

- Structured JSON logs with PII redaction (emails/phones)
- No raw PII is ever logged
- Crisis guidance is provided in replies when needed; no diagnoses

---

## 📄 License & Contributing

MIT License. PRs and contributions are welcome!


### Troubleshooting


### Privacy & Safety


### License & Contributing

MIT License. PRs welcome.


