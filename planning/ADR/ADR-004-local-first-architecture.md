# ADR-004: Local-First Architecture — Eliminate Celery/Redis/Multi-Service Complexity

**Date**: 2026-04-22  
**Status**: Accepted  
**Supersedes**: Portions of TECHNICAL_ARCHITECTURE.md (Celery queue, Redis, multi-service deployment)

---

## Context

The original architecture specified:
- Redis 7+ as a task queue
- Celery 5+ as a distributed worker
- PostgreSQL as the primary database
- Docker Compose to orchestrate 4+ services
- ELK Stack for logging
- Prometheus + Grafana for monitoring
- Multi-tenant auth (JWT/OAuth2)

This is the architecture of a SaaS platform. It is not the architecture of a product whose core promise is:

> "普通人也能亲眼看懂的研究引擎。把研究过程从黑箱里拿出来，交还给用户判断。"

Running 6 services to let one user run one research loop is not transparency — it is the opposite.

---

## Decision

**Adopt a Local-First architecture.** The entire system runs on the user's machine as two processes:

1. `Next.js` dev server (frontend, port 3000)
2. `FastAPI` single process (backend, port 8000)

The Research Engine (`services/worker/`) is a **Python package imported by FastAPI**, not a separate service. FastAPI uses `asyncio` + `BackgroundTasks` to run the research loop in the background while streaming progress via SSE.

### What is eliminated

| Eliminated | Reason |
|------------|--------|
| Redis | No distributed queue needed for single-user local execution |
| Celery | Over-engineering; `asyncio.BackgroundTasks` is sufficient |
| Docker Compose (Phase 1) | Two processes start with `npm run dev` + `uvicorn`; no container needed |
| ELK Stack | Structured logging to local files is sufficient |
| Prometheus + Grafana | Not needed until multi-user cloud deployment |
| JWT / OAuth2 / Multi-tenant | Single-user local app has no auth surface |
| PostgreSQL (demoted) | See ADR-005 |

### What replaces them

| Replaced by | Role |
|-------------|------|
| `asyncio.BackgroundTasks` | Non-blocking research loop execution |
| FastAPI `StreamingResponse` (SSE) | Real-time progress delivery to frontend |
| SQLite (see ADR-005) | Persistent storage of tasks, runs, results, nodes |
| FAISS + local embeddings | Vector memory, no external service |
| Structured JSON logs to `./logs/` | Observability without ELK |

---

## Architecture Diagram

```
User Browser (localhost:3000)
        │
        │  HTTP / SSE
        ▼
  Next.js (frontend)
        │
        │  fetch / EventSource
        ▼
  FastAPI (localhost:8000)
        │
        ├── POST /api/tasks      → creates task in SQLite, starts background job
        ├── GET  /api/tasks/{id}/stream  → SSE: streams research loop events
        ├── GET  /api/tasks/{id}         → task status
        └── GET  /api/results/{id}       → final result
        │
        │  import (same process)
        ▼
  services/worker/  (Python package)
        ├── pipeline.py    — orchestrates the research loop
        ├── researcher.py  — LiteLLM call → generates candidate
        ├── engineer.py    — subprocess exec → evaluates candidate
        ├── analyzer.py    — LiteLLM call → interprets result
        └── memory.py      — FAISS + sentence-transformers
        │
        ▼
  SQLite (./data/rus.db)
  FAISS index (./data/faiss/)
```

---

## Evolution Path (No Migration Required)

This architecture is not a temporary workaround. It evolves additionally, not by replacement:

| Stage | What changes |
|-------|-------------|
| Stage 1 (now) | Two local processes |
| Stage 2 | Tauri wraps both into a desktop `.exe/.dmg` |
| Stage 3 (optional) | Add S3/R2 sync for SQLite backup — SQLite stays primary |
| Stage 4 (if multi-user needed) | Add auth layer, swap SQLite → PostgreSQL via single SQLAlchemy config line |

Each stage adds capability without invalidating the previous stage's code.

---

## Consequences

**Positive**:
- Development environment: `uvicorn main:app --reload` + `npm run dev`. No Docker required.
- Zero infrastructure dependencies for the user (no Redis, no Postgres server to install)
- Research loop is fully inspectable in one codebase
- SSE is simpler and more reliable than WebSocket for unidirectional streaming
- SQLite file is portable — copy it to backup or inspect it with any SQLite viewer

**Negative**:
- Single-process FastAPI cannot scale to multiple concurrent users without adding a queue
- If multi-user is needed in the future, adding Redis/Celery is straightforward (SQLAlchemy interface is already abstracted)

**Accepted trade-off**: Single-user local execution is the product definition for Stage 1 and Stage 2. Multi-user is a deliberate Stage 4 decision, not a current constraint.

---

## References

- [SQLite is not a toy database](https://antonz.org/sqlite-is-not-a-toy-database/)
- [Litestream — streaming SQLite replication to S3](https://litestream.io/)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [FastAPI SSE with StreamingResponse](https://fastapi.tiangolo.com/advanced/custom-response/)
