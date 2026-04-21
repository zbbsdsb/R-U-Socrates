# R U Socrates — Execution Plan

> **This is the living plan document.** Updated before every implementation session.
> All other files in `planning/` are reference material unless explicitly noted.

---

## Project Vision

Transform ASI-Evolve (an autonomous AI research framework) into a product that普通用户 can understand, run, verify, and publish results from — via a Socratic human-AI dialogue workflow.

**Core loop**: User poses a question → System autonomously runs research experiments → Returns Socratic-style explanation with evidence.

---

## Status: Phase 0 — Code Analysis Complete; Execution Pending

**Planning documents reviewed. ASI-Evolve source code fully analyzed (55 files).**

**Execution blocked by Windows compatibility** (see `planning/reports/phase0-validation.md` §5):
1. `Engineer` uses `["bash", script_path]` — POSIX-only subprocess call
2. `ASI-Evolve-main` directory name contains hyphens — Python imports need `Evolve` (no hyphen)
3. `eval.sh` calls `python3` — command name invalid on Windows

**Resolution path**: Use Git Bash / WSL for Phase 0 execution. Phase 1 will build a Windows-compatible subprocess wrapper (replacing bash with direct Python calls).

---

## Development Principle

**Docs first, then code.**

Every implementation session follows:
1. Update this document with decisions made
2. Write or update any relevant ADR
3. Only then write code

---

## Phased Roadmap

### Phase 0 — Upstream Validation *(~1 week)*

> ⚠️ **Windows users**: Phase 0 execution requires Git Bash, WSL, or a Unix-like shell.
> Engineer uses `bash script.sh` for evaluation (POSIX-only). See `planning/reports/phase0-validation.md` §5.

**Goal**: Run ASI-Evolve locally, understand actual behavior, correct planning assumptions.

| Task | Output |
|------|--------|
| Read `pipeline/main.py` in depth | Annotated flow: `Pipeline.run_step()` → Researcher → Engineer → Analyzer |
| Read `utils/structures.py` | Full list of Node / CognitionItem field definitions |
| Configure `config.yaml` | Working config with one accessible LLM (OpenAI or Ollama) |
| Execute one complete experiment | Console output + metrics, confirm闭环 |
| Inventory real dependencies | `pip freeze` vs actual imports — find discrepancies |

**Exit criterion**: One complete research loop runs without error, producing a valid result.

**Key output**: `planning/reports/phase0-validation.md` — lessons learned, corrected assumptions.

---

### Phase 1 — Monorepo Skeleton + Core Services *(~2–3 weeks)*

**Goal**: A runnable system without a frontend. API + Worker + Memory + ModelGateway.

**Build order (dependency-driven)**:

```
packages/types/          ← Zero dependencies, defined first
    ↓
services/memory/         ← FAISS + sentence-transformers, no external DB
    ↓
services/model-gateway/  ← LiteLLM wrapper (NOT custom adapters)
    ↓
services/worker/         ← Research loop: fork of ASI-Evolve pipeline
    ↓
services/api/            ← FastAPI + Celery + Redis
    ↓
infra/compose/           ← docker-compose tying all services
```

**Intentional deferrals** (Phase 1):
- PostgreSQL → **SQLite** (SQLAlchemy interface, swap cost ≈ zero)
- Docker sandbox → **Process exec with timeout** (security acceptable for MVP in controlled env)
- S3 storage → **Local filesystem**
- Kubernetes → **Docker Compose only**

**Exit criterion**: `POST /api/tasks` → task queued → worker executes → `GET /api/tasks/{id}/results` returns structured output.

---

### Phase 2 — Frontend + Real User Flow *(~3–4 weeks)*

**Goal**: A web UI where a real user can complete the full workflow.

Priority pages:
1. **Task Creation** — select template → fill parameters → submit
2. **Run Monitor** — real-time progress via SSE (Researcher / Engineer / Analyzer stages)
3. **Result Display** — Socratic-style explanation, evidence list, downloadable report

Secondary:
- Template library browser
- Settings (model selection, API key config)

**Exit criterion**: A user with no ML background can create a task and read a result.

---

### Phase 3 — Hardening & Real Deployment *(~2–3 weeks)*

This is where the deferred items from Phase 1 get addressed:

| Upgrade | Trigger |
|---------|---------|
| SQLite → PostgreSQL | Multi-user write concurrency needed |
| Process exec → Docker sandbox | Production / untrusted user input |
| Local FS → S3-compatible | Cloud deployment, multi-instance |
| Docker Compose → Kubernetes | Scale beyond single node |

**Trigger-based, not date-based.** Only execute when a real need exists.

---

## Dependency Graph

```
packages/types          ← all other packages/services depend on this
      ↓
services/memory         ← uses types; FAISS + sentence-transformers
      ↓                          ↑
services/model-gateway  ← uses types; LiteLLM
      ↓                          ↑
services/worker         ← uses types + memory + model-gateway
      ↓
services/api           ← uses types + worker; FastAPI + Celery
      ↓
apps/web               ← uses types; Next.js
      ↓
infra/compose          ← orchestrates all services
```

---

## Technology Stacks

### Phase 1–2 (Confirmed)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14, React 18, TypeScript 5, TailwindCSS, Shadcn/UI, Zustand | |
| Backend | Python 3.10+, FastAPI 0.100+, SQLAlchemy 2.0+ | |
| Database (Phase 1) | SQLite (dev) → PostgreSQL 15+ (Phase 3) | |
| Queue (Phase 1) | Redis 7+ + Celery 5+ | |
| Vector store | FAISS 1.7+ + sentence-transformers (all-MiniLM-L6-v2) | |
| LLM interface | **LiteLLM** (NOT custom adapters) | ADR-003 |
| Sandboxing (Phase 1) | Process exec + timeout + ulimit | ADR-002 |
| Container | Docker 20+, Docker Compose 2.0+ | Phase 1 Compose only |

### Phase 3 (Deferred)

| Layer | Technology | Trigger |
|-------|-----------|---------|
| Storage | S3-compatible (MinIO / AWS S3) | Cloud deployment |
| Sandbox | Docker containers or gVisor | Untrusted input |
| Orchestration | Kubernetes | Multi-node scale |
| Observability | Prometheus + Grafana | Production monitoring |

---

## Module Inventory (Reference: MODULE_BREAKDOWN.md)

### Will be built in Phase 1

- `packages/types/` — shared TypeScript types (Task, Run, Result, Template, Model)
- `packages/utils/` — logger, error handler, validator
- `services/memory/` — CognitionStore, ExperimentDatabase, VectorIndex, KnowledgeDistiller
- `services/model-gateway/` — LiteLLM wrapper, cost tracking
- `services/worker/executor.py` — TaskExecutor, RetryManager
- `services/worker/researcher.py` — adapted from ASI-Evolve
- `services/worker/engineer.py` — adapted from ASI-Evolve
- `services/worker/analyzer.py` — adapted from ASI-Evolve
- `services/api/` — FastAPI routes + SQLAlchemy models

### Will be built in Phase 2

- `apps/web/` — Next.js pages and components
- `apps/web/stores/` — Zustand stores
- `apps/web/services/` — API client services
- `infra/compose/` — docker-compose.yml

### Deferred

- `services/worker/sandbox.py` — Docker/gVisor sandbox
- `packages/adapters/` — ASI-Arch adapter
- `apps/desktop/` — Tauri desktop app
- `infra/kubernetes/` — K8s manifests

---

## API Design Summary

See `planning/TECHNICAL_ARCHITECTURE.md` §4 for full endpoint spec. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tasks` | Create a new research task |
| GET | `/api/tasks/{id}` | Get task status and progress |
| GET | `/api/tasks/{id}/runs` | List all runs for a task |
| GET | `/api/results/{task_id}` | Get latest result |
| GET | `/api/results/{task_id}/export?format=md` | Export result |
| GET | `/api/templates` | List available templates |
| GET | `/api/templates/{id}` | Get template detail |
| POST | `/api/templates` | Create custom template |

---

## Upstream Reference Projects

### ASI-Evolve (primary kernel)
- **Location**: `prepare/ASI-Evolve-main/`
- **Strength**: Modular, runs locally (FAISS + sentence-transformers), 7 core dependencies
- **Core file**: `pipeline/main.py` — `Pipeline.run_step()` → 4-stage闭环
- **Adaptation**: Fork the pipeline into `services/worker/`, replace hardcoded config with env-driven config

### ASI-Arch (specialized capability)
- **Location**: `prepare/ASI-Arch-main/`
- **Strength**: 1773 experiments, 106 SOTA architectures, linear attention discovery
- **Constraint**: Requires external MongoDB + OpenSearch (high reproduction barrier)
- **Adaptation**: Wrap as an adapter in `packages/adapters/` — Phase 3 at earliest

---

## License

- **Core layer** (ASI-Evolve fork): Apache-2.0
- **Application layer** (web shell, new adapters, templates): PolyForm Noncommercial (source-available, not open-source)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-21 | Initial execution plan created. MVP-first strategy: Phase 0 upstream validation → Phase 1 monorepo skeleton → Phase 2 frontend → Phase 3 hardening. Key ADRs: SQLite in Phase 1 (ADR-001), no sandbox in Phase 1 (ADR-002), LiteLLM over custom adapters (ADR-003). | AI |
