# GROUNDED AI

---

## Prerequisites

- PostgreSQL (with `pgvector` extension)
- Redis Server
- AWS S3 bucket
- Node.js 20+
- Python 3.12+
- `uv` Python package manager
- `pnpm` Node package manager

## Setup

### 1. Database Setup
Ensure you have a PostgreSQL database running with the `pgvector` extension enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Copy the example environment variables file and fill in your details:
   ```bash
   cp .env.example .env
   ```
3. Sync dependencies using `uv`:
   ```bash
   uv sync
   ```
4. Run Alembic migrations to set up your database schema:
   ```bash
   uv run alembic upgrade head
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Copy the example environment variables file:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

## Running the Application

You will need three terminal instances to run the full application stack locally:

### Terminal 1: FastAPI Backend
```bash
cd backend
uv run uvicorn main:app --port 8000
```

### Terminal 2: ARQ Background Worker
```bash
cd backend
uv run arq worker.WorkerSettings
```

### Terminal 3: Next.js Frontend
```bash
cd frontend
pnpm dev
```

The frontend will be available at `http://localhost:3000`.
