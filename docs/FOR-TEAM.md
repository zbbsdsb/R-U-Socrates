# R U Socrates — Engineering Handoff Document

> **For the incoming development team.** This document covers the current state of the codebase, what's done, what isn't, what works, and what needs attention. Written in English for international contributors.

---

## Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [Current Feature Status](#2-current-feature-status)
3. [Architecture Overview](#3-architecture-overview)
4. [Running the App Locally](#4-running-the-app-locally)
5. [Key Technical Decisions](#5-key-technical-decisions)
6. [The SSE Event System](#6-the-sse-event-system)
7. [Database Schema](#7-database-schema)
8. [Frontend Component Map](#8-frontend-component-map)
9. [Known Issues & Technical Debt](#9-known-issues--technical-debt)
10. [Critical Gaps to Address](#10-critical-gaps-to-address)
11. [Roadmap](#11-roadmap)
12. [Contributing Guidelines](#12-contributing-guidelines)

---

## 1. What This Project Does

R U Socrates is a **local-first, transparent AI research engine**. The core idea: instead of asking an LLM for an answer and trusting it blindly, you watch a loop of three specialized agents work through a research problem in real time.

```
User submits a task
       │
       ▼
Researcher ──→ Engineer ──→ Analyzer ──→ (next iteration)
     │              │             │
     └── code        └── score      └── insight
                              │
                              ▼
                       Best solution found
```

Every step — the code the Researcher generated, the score the Engineer computed, the Analyzer's reasoning — is streamed live to the browser via Server-Sent Events (SSE). The user sees the full process, not just the conclusion.

---

## 2. Current Feature Status

### ✅ Completed (v0.1.0)

| Feature | Location | Status |
|---------|----------|--------|
| Task CRUD (create/list/get/delete/cancel) | `services/api/routes/tasks.py` | Working |
| SSE streaming of pipeline events | `services/api/routes/tasks.py` → `stream_task()` | Working |
| Research pipeline (Researcher/Engineer/Analyzer) | `services/worker/pipeline.py` | Working |
| LiteLLM integration (100+ models) | `services/worker/llm.py` | Working |
| FAISS vector memory (lazy-init) | `services/worker/memory.py` | Working |
| SQLite DB with WAL mode | `services/api/database.py` | Working |
| L1 Live Reasoning Feed | `apps/web/components/reasoning/` | Working |
| Iteration accordion cards | `apps/web/components/reasoning/IterationAccordion.tsx` | Working |
| Shiki syntax highlighting | `apps/web/components/reasoning/CodeBlock.tsx` | Working |
| Dark/light/system theme toggle | `apps/web/app/layout.tsx` | Working |
| Toast notification system | `apps/web/components/ui/toast.tsx` | Working |
| Settings page (LLM provider config) | `apps/web/app/settings/` | Working |
| Template prefill on task creation | `apps/web/app/(main)/tasks/page.tsx` | Working |
| Breadcrumb navigation | `apps/web/app/tasks/[id]/page.tsx` | Working |
| Stop/Delete task buttons | `apps/web/app/tasks/[id]/page.tsx` | Working |
| Docker (dev) | `Dockerfile`, `docker-compose.yml` | Ready |

### ❌ Not Yet Implemented

| Feature | File to Create | Notes |
|---------|---------------|-------|
| **L2 Reasoning Tree** | `components/reasoning/ReasoningTree.tsx`, `TreeNode.tsx` | Visual node exploration tree. No backend changes needed — data is in `ExploredNode` DB table and `reasoningStore` |
| **L3 Score Journey** | `components/reasoning/ScoreChart.tsx` | Iteration-over-iteration score chart. Use `recharts`. `npm install recharts` needed |
| **Electron .exe packaging** | — | `electron-builder` is configured. `npm run build:electron` was interrupted. Run it again on a stable network |
| **`prepare/` directory cleanup** | — | Temporary upstream reference files from ASI-Evolve/ASI-Arch. Should be removed before production |
| **Multi-user auth** | — | Phase 3 item. Not in scope for v0.x |
| **PostgreSQL** | — | Phase 3 item. SQLite only for now |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                              │
│  http://localhost:3000  (Next.js 14, React 18)           │
│     │  EventSource / fetch                               │
└─────┼───────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│           http://localhost:8000  (FastAPI)              │
│  tasks.py  ──→  pipeline.run()  ──→  SSE events       │
│  results.py                                               │
└─────┬───────────────────────────────────────────────────┘
      │ asyncio BackgroundTasks (no queue, no Redis)
      ▼
┌─────────────────────────────────────────────────────────┐
│           services/worker/ (Python package)             │
│  pipeline.py    — async generator, orchestrates loop     │
│  researcher.py  — LLM call, XML tag extraction          │
│  engineer.py    — subprocess + eval scoring              │
│  analyzer.py    — LLM call, Socratic analysis           │
│  memory.py      — NodeDatabase (FAISS) + CognitionStore │
│  llm.py         — LiteLLM wrapper                       │
│  models.py      — PipelineEvent, Node, RunConfig        │
└─────┬───────────────────────────────────────────────────┘
      │
      ▼
   SQLite (./data/rus.db) + FAISS index (./data/faiss/)
```

**No containers required for development.** The worker is imported as a Python package directly into FastAPI.

---

## 4. Running the App Locally

### Prerequisites

- Node.js 18+
- Python 3.10+
- An LLM API key (OpenAI, Anthropic, Qwen, DeepSeek, Ollama — any LiteLLM-compatible provider)

### Step 1 — Frontend

```bash
cd apps/web
npm install
npm run dev
# Open http://localhost:3000
```

### Step 2 — Backend

```bash
cd services/api

# Create .env with your API key
cp ../.env.example .env
# Edit .env: set OPENAI_API_KEY=sk-... or DASHSCOPE_API_KEY=sk-...

pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 3 — Create a task

Open http://localhost:3000, click **New Task**, enter a description like:

> Find a faster implementation of bubble sort. Test it against the standard library's sorted() on random arrays of size 100–10000. Score by speedup factor.

Then watch the reasoning unfold in the Live Feed.

---

## 5. Key Technical Decisions

See `planning/ADR/` for full decision records. Summary:

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | SQLite for dev and production (Phase 1-2) | Simplicity; no ops overhead; WAL mode handles concurrency |
| ADR-002 | No sandbox isolation (Phase 1) | Use subprocess + timeout instead of Docker/gVisor |
| ADR-003 | LiteLLM as unified LLM interface | 100+ models, single API, easy to swap providers |
| ADR-004 | Local-first, no Redis/Celery | Eliminates 5 services; worker imported as Python package |
| ADR-005 | SQLite is long-term, not temporary | ACID, WAL, zero-config. Scale to PostgreSQL only when >1 concurrent user |
| ADR-007 | L1/L2/L3 reasoning visualization, frontend-only | All three layers consume the same SSE stream. Zero new backend endpoints needed |

---

## 6. The SSE Event System

The transparency mechanism is a single async generator in `pipeline.py`. Every meaningful step yields a `PipelineEvent`:

```python
# services/worker/pipeline.py — in pipeline.run()
yield PipelineEvent(
    type=EventType.RESEARCHER_COMPLETE,
    run_id=run_id,
    iteration=iteration,
    agent_type="researcher",          # ADR-007: enables L2/L3 classification
    node_name=node.name,
    node_motivation=node.motivation,
    node_code_preview=node.code[:300],
)
```

**Full event type list** (defined in `services/worker/models.py → EventType`):

| Event type | When emitted | Frontend consumer |
|-----------|-------------|-------------------|
| `run_started` | Pipeline begins | `reasoningStore.subscribe()` |
| `iteration_started` | New iteration begins | — |
| `memory_sampled` | UCB1 node sampling done | — |
| `cognition_retrieved` | Memory search done | — |
| `researcher_started` | Researcher LLM call starts | `reasoningStore` → `ResearcherCard` |
| `researcher_complete` | Researcher LLM returns | `reasoningStore` → `ResearcherCard` |
| `researcher_failed` | Researcher LLM error | `reasoningStore` |
| `engineer_started` | Subprocess starts | `reasoningStore` → `EngineerCard` |
| `engineer_complete` | Evaluation returns | `reasoningStore` → `EngineerCard` |
| `engineer_failed` | Timeout / crash | `reasoningStore` |
| `analyzer_started` | Analyzer LLM call starts | `reasoningStore` → `AnalyzerCard` |
| `analyzer_complete` | Analysis returns | `reasoningStore` → `AnalyzerCard` |
| `analyzer_failed` | Analyzer LLM error | `reasoningStore` |
| `iteration_complete` | Iteration done, node persisted | DB (`ExploredNode`) |
| `run_complete` | All iterations done | `reasoningStore` → completion banner |
| `run_failed` | Unhandled exception | `reasoningStore` → failure banner |

The frontend `reasoningStore.ts` normalises these events into `IterationData` grouped by iteration number. This store is the single source of truth for all three reasoning visualization layers.

---

## 7. Database Schema

### Tables

**`Task`** — one row per research task
- `id`, `name`, `description`, `status`, `model`, `max_iterations`, `created_at`, `updated_at`

**`Run`** — one row per pipeline run (a task can have multiple runs)
- `id`, `task_id`, `status`, `best_score`, `total_nodes`, `total_iterations`, `error_message`, `started_at`, `completed_at`

**`ExploredNode`** — one row per iteration, persisted from `iteration_complete` events. **This table powers the L2 Reasoning Tree** (not yet built).
- `id`, `run_id`, `node_idx`, `name`, `motivation`, `code`, `analysis`, `score`, `eval_success`, `created_at`

**`Result`** — the final output of a completed run
- `id`, `run_id`, `best_score`, `best_node_name`, `best_node_motivation`, `best_node_code`, `best_node_analysis`, `stats_json`, `created_at`

> **Note:** The L2 Reasoning Tree needs `parent_id` on `ExploredNode` to reconstruct the exploration tree. Currently `Node.parent` is a Python list stored in memory; it is NOT persisted to the DB. This is a gap that needs to be fixed before L2 can be built.

---

## 8. Frontend Component Map

```
apps/web/
├── app/
│   ├── page.tsx                        ← Landing page
│   ├── (main)/
│   │   └── tasks/page.tsx             ← Task list + create form
│   ├── tasks/[id]/page.tsx            ← Task detail + ReasoningFeed
│   ├── results/[id]/page.tsx          ← Final results + Markdown export
│   ├── settings/page.tsx              ← LLM provider config
│   ├── templates/page.tsx             ← Template gallery
│   └── docs/page.tsx                  ← Documentation page
├── components/
│   ├── reasoning/
│   │   ├── ReasoningFeed.tsx          ← L1 container (done ✅)
│   │   ├── IterationAccordion.tsx     ← Iteration card (done ✅)
│   │   ├── ResearcherCard.tsx         ← Stage card (done ✅)
│   │   ├── EngineerCard.tsx           ← Stage card (done ✅)
│   │   ├── AnalyzerCard.tsx           ← Stage card (done ✅)
│   │   └── CodeBlock.tsx              ← Shiki highlighter (done ✅)
│   │   ├── ReasoningTree.tsx           ← L2 tree (NOT built ❌)
│   │   └── ScoreChart.tsx             ← L3 chart (NOT built ❌)
│   ├── Navbar.tsx
│   ├── ScoreCard.tsx
│   ├── RunErrorCard.tsx
│   └── ui/                            ← Shadcn/UI components
├── stores/
│   ├── reasoningStore.ts              ← SSE event → IterationData (done ✅)
│   ├── taskStore.ts
│   └── settingsStore.ts
└── services/
    └── taskService.ts                 ← API client + EventSource
```

---

## 9. Known Issues & Technical Debt

### P0 — Must Fix Before Production

1. **Missing `parent_id` on `ExploredNode`**
   - `Node.parent` is a list of integers in Python memory (`services/worker/models.py`)
   - The DB migration to add a `parent_id` column to `ExploredNode` has NOT been written
   - **Impact:** L2 Reasoning Tree cannot be built without this
   - **Fix:** Add `parent_id: Optional[int]` column to `ExploredNode` ORM model and DB migration. Set it from `event.parent[0]` (or `null`) in `_persist_iteration()` in `routes/tasks.py`

2. **Duplicate `electron` in `package.json` devDependencies**
   ```json
   "electron": "^31.0.0",
   "electron": "31.0.0",   // ← duplicate string key, the value 31.0.0 wins
   ```
   This is a copy-paste artifact. Remove one of them.

### P1 — Should Fix Soon

3. **`prepare/` directory not cleaned up**
   - Contains `ASI-Evolve-main/` and `ASI-Arch-main/` — upstream reference files
   - Should be deleted before any public release
   - Path: `e:/ceaserzhao/github projects/R U Socrates/prepare/`

4. **XML tag extraction is fragile**
   - Researcher and Analyzer use regex-based XML tag extraction (`<name>`, `<code>`, `<analysis>`)
   - If the LLM omits or mangles tags, the code falls back to `_extract_code_block()` regex on backtick blocks
   - Works, but is not robust for all model outputs
   - **Consider:** Use a proper XML parser (e.g., `defusedxml`) and log when extraction fails

5. **No validation on `task.description` length**
   - A 10,000-character description will be passed directly to the LLM
   - Consider adding a max length (e.g., 2000 chars) in `schemas.py` + frontend validation

### P2 — Nice to Have

6. **No integration tests**
   - No `pytest` or Playwright tests exist
   - The `next.config.mjs` `output: "standalone"` was added but the Docker build hasn't been verified end-to-end
   - A simple smoke test (start API, create task, check DB) would be high value

7. **No rate limiting or retry logic**
   - If the LLM API call fails, the pipeline logs the error and `continue`s to the next iteration
   - Users have no way to retry a failed iteration
   - Consider adding a `max_retries` config per stage

8. **Score normalization is unclear**
   - `eval_score` comes from `evaluator.py` which runs a user-supplied script
   - Different evaluators produce scores on different scales (0-1, 0-100, custom)
   - The UI displays scores as percentages; this assumes a 0-1 scale
   - **Document this assumption clearly** in the evaluator template

---

## 10. Critical Gaps to Address

### Gap 1: Parent-child relationships are not persisted

As noted in P0 above. Without `parent_id` in the DB, the L2 Reasoning Tree is impossible. The data exists in the Python `Node` object at runtime but is lost on persistence.

### Gap 2: L2 and L3 components don't exist

Both are planned in `planning/REASONING_VISUALIZATION.md`. The data is available:
- L2: needs `parent_id` + a tree rendering component (`d3-hierarchy` or recursive CSS)
- L3: `scoreHistory` is already being accumulated in `reasoningStore.ts` — just needs a `recharts` chart component

### Gap 3: Electron packaging was not completed

`electron-builder` is configured and `electron/main.js` launches Next.js dev server. However:
- The build was interrupted due to network issues (unable to download Electron binaries)
- The portable .exe was not generated
- Run `npm run build:electron` on a stable network when ready

### Gap 4: No CI/CD

- No GitHub Actions workflows
- No automated tests
- Docker image build has not been tested end-to-end

---

## 11. Roadmap

### v0.2.0 — Reasoning Tree
- Add `parent_id` to `ExploredNode` (DB migration)
- Build `ReasoningTree.tsx` and `TreeNode.tsx`
- Wire tree to `reasoningStore` — click node → scroll to iteration card
- Visual states: alive (solid), pruned (dashed/greyed), best (gold star)

### v0.3.0 — Score Journey
- `npm install recharts`
- Build `ScoreChart.tsx` (iteration-over-iteration line chart)
- "New best" annotation markers
- Hover tooltips with full iteration details

### v0.4.0 — Electron Release
- Verify `npm run build:electron` completes on stable network
- Publish portable .exe to GitHub Releases
- Test on a clean Windows machine (no dev tools installed)

### v1.0.0 — Production Readiness
- Integration tests (pytest + Playwright)
- CI/CD pipeline (GitHub Actions)
- `prepare/` directory removed
- PostgreSQL option documented
- User documentation / getting started guide

---

## 12. Contributing Guidelines

### Code Style

- **Python:** Follow PEP 8. Max line length 100. Use type hints on all public functions.
- **TypeScript:** Strict mode. No `any`. Prefer `interface` over `type` for object shapes.
- **Commits:** Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
  - Examples: `feat(reasoning): add score chart`, `fix(api): handle missing task gracefully`

### Before Opening a PR

1. `npm run typecheck` passes (no TypeScript errors)
2. `npm run lint` passes (no ESLint errors)
3. Backend starts without errors: `cd services/api && uvicorn main:app --reload`
4. New features have a CHANGELOG entry

### Architecture Rules

1. **Zero mock in user-facing UI.** Every component must connect to a real API endpoint or SSE stream. No hardcoded fake data in the UI layer.
2. **All new backend features go behind a REST endpoint.** No client-side logic should import Python modules directly.
3. **New architectural decisions → write an ADR.** Place it in `planning/ADR/ADR-XXX-short-title.md`. Include: Context, Decision, Consequences, Alternatives Considered.
4. **L1/L2/L3 data comes from SSE.** Don't create new backend endpoints for frontend visualization data unless the data genuinely cannot be derived from existing SSE events.

### Environment Variables

Never commit API keys. All keys go in `services/api/.env` (gitignored). Use `services/.env.example` as the template for new contributors.

### Key Files to Know

| File | Purpose |
|------|---------|
| `services/worker/pipeline.py` | The async generator that IS the product. Read this first. |
| `services/worker/models.py` | All event types + `PipelineEvent.to_sse_dict()` — the contract between backend and frontend |
| `apps/web/stores/reasoningStore.ts` | Normalises SSE events into `IterationData`. The store for all three visualization layers. |
| `apps/web/components/reasoning/ReasoningFeed.tsx` | L1 UI entry point. Where a new contributor should start reading the frontend. |
| `services/api/routes/tasks.py` | FastAPI routes + `_run_pipeline()` background task. Connects HTTP to the pipeline. |
| `planning/REASONING_VISUALIZATION.md` | The product spec for the core differentiating feature. |

---

*Document version: 1.0 — prepared for team handoff, May 2026.*
