# R U Socrates — Execution Plan

> **This is the living plan document.** Updated before every implementation session.
> All other files in `planning/` are reference material unless explicitly noted.

---

## Project Vision

> "普通人也能亲眼看懂的研究引擎。真正稀缺的不是生成创意，而是把研究过程从黑箱里拿出来，交还给用户判断。"

Transform ASI-Evolve (an autonomous AI research framework) into a **local-first research tool** where any person can pose a real research question, watch the reasoning process unfold in real time, and receive a verifiable, publishable result — without any black boxes.

**Product principles**:
1. **Transparency over conclusions** — users see the reasoning path, not a summary
2. **User is the judge** — system shows evidence and trade-offs, never decides for the user
3. **Zero mock** — every user-facing feature connects to real data

---

## Architecture (as of 2026-04-22)

**Two processes. No queue. No containers required for development.**

```
Browser (localhost:3000)
        │  fetch / EventSource (SSE)
        ▼
  Next.js frontend
        │
        ▼
  FastAPI (localhost:8000)
        │  asyncio BackgroundTasks
        ▼
  services/worker/  ← Python package, imported directly (NOT a separate service)
        ├── pipeline.py
        ├── researcher.py   (LiteLLM)
        ├── engineer.py     (subprocess, Python-native)
        └── analyzer.py     (LiteLLM)
        │
        ▼
  SQLite (./data/rus.db) + FAISS (./data/faiss/)
```

**Key ADRs**:
- ADR-004: Local-first — Redis, Celery, Docker Compose eliminated from dev stack
- ADR-005: SQLite is long-term architecture, not a temporary compromise
- ADR-003: LiteLLM as the unified LLM interface
- ADR-002: No sandbox in Stage 1 — direct Python subprocess with timeout

---

## Current Status (2026-04-23)

### ✅ Complete
- `packages/types/` — shared TypeScript types
- `apps/web/` — frontend with full user flow, **zero mock**:
  - `services/taskService.ts` — real API client, `EventSource` SSE, `PipelineEvent` mirroring backend schema
  - `stores/taskStore.ts` — UI-only state, SSE-driven
  - `app/tasks/page.tsx` — real `listTasks()` + `createTask()`
  - `app/tasks/[id]/page.tsx` — real SSE subscription, stage pipeline, live log
  - `app/results/[id]/page.tsx` — real `getResult()` + Markdown export
  - `app/page.tsx` — home page
- `services/worker/` — full pipeline: Researcher / Engineer / Analyzer, `PipelineEvent` async generator, LiteLLM, FAISS memory, UCB1 sampling
- `services/api/` — FastAPI + SQLite WAL + SSE endpoint + background pipeline launcher
- `services/worker/evaluator.py` — MVP evaluator: `user_defined_score()` > execution scoring with test harness
- Planning documents: 5 ADRs written, architecture finalized
- Bug fixes (2026-04-23): removed spurious `from .models import LLMResponse` in `llm.py`; replaced deprecated `get_event_loop()` with `asyncio.get_running_loop()` in `pipeline.py`

### 🚧 Ready to Run
- All Python dependencies installed (`fastapi`, `uvicorn`, `litellm`, `sentence-transformers`, `faiss-cpu`, `numpy`)
- Missing only: `OPENAI_API_KEY` (or equivalent LiteLLM-compatible key) in `services/api/.env`

### ⏳ Pending
- Full end-to-end integration test: FastAPI + Next.js simultaneously
- `prepare/` cleanup (temporary upstream reference, to be removed post-fork)

### 🔬 Reasoning Visualization (Feature — ADR-007)
**Plan:** `planning/REASONING_VISUALIZATION.md`

Core product feature: make the AI research reasoning process transparent and legible to non-technical users.

Three layers, increasing depth:
- **L1 — Live Reasoning Feed** (~4h): Real-time SSE panel on Task Detail page. Each iteration renders as an accordion card showing Researcher motivation → Engineer code → Analyzer score + stdout. Shiki syntax highlighting. Auto-scroll + "New events" button.
- **L2 — Reasoning Tree** (~3h): SVG tree of explored nodes with parent/child relationships reconstructed from SSE events. Zero backend changes. Alive / pruned / best states visually distinct.
- **L3 — Score Journey** (~2h): Iteration-over-iteration score chart with `recharts`. "New best" annotations, hover tooltips, responsive.

**Backend prerequisite (1-line fix):** Add `event.type = "researcher"|"engineer"|"analyzer"` to SSE emission in `pipeline.py`. See `planning/ADR/ADR-007-reasoning-visualization.md`.

**File manifest:** `components/reasoning/` (8 components) + `stores/reasoningStore.ts` (Zustand).

---

## Build Order

Dependencies drive the order. Each step is a complete, runnable unit.

```
Step 1: packages/types/          ✅ Done
    ↓
Step 2: services/worker/         ← Fork ASI-Evolve pipeline
    ↓                               Pure Python package, no HTTP, no queue
Step 3: services/api/            ← FastAPI wrapping worker
    ↓                               SSE endpoint streams worker events
Step 4: apps/web/ (real)         ← Remove mock, connect EventSource to SSE
```

**What is NOT in the build order** (eliminated per ADR-004):
- ~~services/memory/~~ → absorbed into `services/worker/memory.py`
- ~~services/model-gateway/~~ → absorbed into `services/worker/llm.py` (LiteLLM wrapper)
- ~~infra/compose/~~ → not needed until Stage 2 (desktop packaging)

---

## Step 2 Detail: services/worker/

**Goal**: A Python package that can run the full research loop and yield structured events.

```
services/worker/
├── __init__.py
├── pipeline.py        — orchestrates the loop; async generator yielding PipelineEvent
├── researcher.py      — adapted from ASI-Evolve; calls LiteLLM
├── engineer.py        — adapted from ASI-Evolve; subprocess with Python fallback (Windows fix)
├── analyzer.py        — adapted from ASI-Evolve; calls LiteLLM
├── memory.py          — FAISS + sentence-transformers (from ASI-Evolve utils/)
├── models.py          — Pydantic models: Node, CognitionItem, PipelineEvent, RunConfig
├── config.py          — env-driven config (LiteLLM model, temperature, max_iterations)
└── requirements.txt
```

**Key design**: `pipeline.py` exposes an async generator:

```python
async def run(config: RunConfig) -> AsyncGenerator[PipelineEvent, None]:
    """
    Yields PipelineEvent for every meaningful step:
    - researcher_start, researcher_done
    - engineer_start, engineer_done
    - analyzer_start, analyzer_done
    - iteration_complete (with score, best_node)
    - run_complete (with final result)
    """
```

FastAPI consumes this generator and forwards events as SSE. Frontend receives them via `EventSource`.

---

## Step 3 Detail: services/api/

**Goal**: Minimal FastAPI app. No auth, no queue, no complexity.

```
services/api/
├── main.py            — FastAPI app, CORS, lifespan
├── routes/
│   ├── tasks.py       — POST /tasks, GET /tasks/{id}, GET /tasks/{id}/stream (SSE)
│   └── results.py     — GET /results/{task_id}, GET /results/{task_id}/export
├── database.py        — SQLAlchemy + SQLite, WAL mode
├── models.py          — ORM models: Task, Run, Node, Result
├── schemas.py         — Pydantic request/response schemas
└── requirements.txt
```

**SSE endpoint**:

```python
@router.get("/tasks/{task_id}/stream")
async def stream_task(task_id: str):
    async def event_generator():
        async for event in worker.pipeline.run(config):
            yield f"data: {event.model_dump_json()}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

---

## Step 4 Detail: apps/web/ (real data)

**Status**: ✅ Complete (2026-04-22)

All mock code eliminated. Every UI component connects to real API endpoints:

| File | What it does |
|------|-------------|
| `services/taskService.ts` | Real `fetch` calls to FastAPI, `EventSource` SSE, `PipelineEvent` interface |
| `stores/taskStore.ts` | UI-only state; `applyPipelineEvent()` merges SSE events |
| `app/tasks/page.tsx` | `listTasks()` + `createTask()`; error states when API offline |
| `app/tasks/[id]/page.tsx` | `getTask()` + `subscribeToRun()`; stage pipeline; live message log |
| `app/results/[id]/page.tsx` | `getResult()` + `getResultMarkdown()`; Markdown export |

---

## Development Workflow

1. **Before every session**: update this document with decisions made
2. **New architectural decision**: write an ADR in `planning/ADR/`
3. **After completing a step**: update Status section above
4. **Zero mock rule**: if it touches user-facing UI, it connects to real data

---

## Evolution Roadmap

| Stage | What | Trigger |
|-------|------|---------|
| Stage 1 (now) | Local two-process app | — |
| Stage 2 | Tauri desktop packaging | When web app is stable |
| Stage 3 | Litestream SQLite → S3 backup | When user asks for cloud backup |
| Stage 4 | Multi-user: add auth + PostgreSQL option | When >1 concurrent user needed |

**Each stage adds capability. No stage requires rewriting the previous stage.**

---

## Upstream Reference

### ASI-Evolve (`prepare/ASI-Evolve-main/`)
- **Core**: `pipeline/main.py` → `Pipeline.run_step()` four-stage closed loop
- **Adapt**: fork into `services/worker/`, replace bash subprocess with Python, make async
- **Key files**: `pipeline/researcher.py`, `pipeline/engineer.py`, `pipeline/analyzer.py`, `utils/`

### ASI-Arch (`prepare/ASI-Arch-main/`)
- Requires external MongoDB + OpenSearch — Stage 4 earliest

---

## License

- Core layer (ASI-Evolve fork): Apache-2.0
- Application layer (web UI, templates, new adapters): PolyForm Noncommercial

---

## Change Log

| Date | Change |
|------|--------|
| 2026-04-21 | Initial plan: MVP-first, Phase 0→1→2→3. ADR-001/002/003. |
| 2026-04-21 | Phase 1 frontend skeleton complete (mock SSE). |
| 2026-04-22 | **Architecture overhaul**: local-first, eliminate Redis/Celery/multi-service. ADR-004/005. New build order: worker → api → frontend (real). |
| 2026-04-22 | **Frontend zero-mock complete**: taskService, taskStore, all pages rewritten to real API/SSE. EXECUTION_PLAN.md updated. |
| 2026-04-25 | ADR-007: Three-layer reasoning visualization architecture decided. `planning/REASONING_VISUALIZATION.md` written. Backend SSE `event.type` prerequisite identified. |
