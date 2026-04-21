# R U Socrates — Project Plan

> **Companion document.** The living execution plan is `planning/EXECUTION_PLAN.md`.
> This document provides project-level context. Technical details are in `planning/TECHNICAL_ARCHITECTURE.md` and `planning/MODULE_BREAKDOWN.md`.

---

## Project Overview

R U Socrates transforms ASI-Evolve (an autonomous AI research framework) into a product that普通用户 can understand, run, verify, and publish from — via a Socratic human-AI dialogue workflow.

**The core value proposition**: A user with no ML background can pose a research question, and the system autonomously runs experiment cycles, returning a Socratic-style explanation backed by evidence.

---

## Target Users

| User Type | Need |
|-----------|------|
| Researchers without ML expertise | Automate experiment search without writing code |
| Curious professionals | Explore hypotheses in structured domains |
| Educators | Generate and verify counter-examples to student propositions |
| Early ASI-Evolve users | A GUI front-end instead of config-file-driven execution |

---

## Strategic Decisions (Summary of ADRs)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | SQLite dev, PostgreSQL prod | Minimize dev friction until multi-user concurrency needed |
| ADR-002 | No sandbox in Phase 1–2 | Developer-only trust model; sandbox is Phase 3 engineering |
| ADR-003 | LiteLLM over custom adapters | ~500 lines of boilerplate avoided; 100+ models supported |

Full text: `planning/ADR/`

---

## Phased Roadmap

### Phase 0 — Upstream Validation (~1 week)

Validate that ASI-Evolve runs locally before planning against it.

**Tasks:**
- Read and annotate `pipeline/main.py`
- Read `utils/structures.py` (Node / CognitionItem schemas)
- Configure `config.yaml` with one accessible LLM (OpenAI or Ollama)
- Run one complete experiment end-to-end
- Produce `planning/reports/phase0-validation.md`

**Exit criterion:** One research loop completes and produces a structured result.

### Phase 1 — Monorepo Skeleton + Core Services (~2–3 weeks)

Build a runnable system without a frontend. Sequence is dependency-driven.

**Tasks:**
1. `packages/types/` — Shared TypeScript types (Task, Run, Result, Template, Model, User)
2. `services/memory/` — FAISS + sentence-transformers, SQLite persistence
3. `services/model-gateway/` — LiteLLM wrapper with model aliasing and cost tracking
4. `services/worker/` — Research loop: Researcher + Engineer + Analyzer adapted from ASI-Evolve
5. `services/api/` — FastAPI routes + SQLAlchemy models + Celery task queue
6. `infra/compose/` — Docker Compose tying all services

**Exit criterion:** `POST /api/tasks` → worker executes → `GET /api/results` returns structured output.

### Phase 2 — Frontend + Real User Flow (~3–4 weeks)

A web UI where a non-technical user can complete the full workflow.

**Pages (by priority):**
1. Task Creation — template selection, parameter configuration, submission
2. Run Monitor — real-time SSE progress (Researcher / Engineer / Analyzer stages)
3. Result Display — Socratic explanation, evidence list, export to Markdown
4. Template Library — browse and preview templates
5. Settings — model selection, API key configuration

**Exit criterion:** A user with no ML background creates a task and reads a result without assistance.

### Phase 3 — Hardening & Real Deployment (~2–3 weeks)

Deferred items from Phase 1, triggered by real needs:

| Upgrade | Trigger |
|---------|---------|
| SQLite → PostgreSQL | Multi-user write concurrency |
| Process exec → Docker sandbox | Untrusted user input in production |
| Local FS → S3-compatible storage | Cloud deployment / multi-instance |
| Docker Compose → Kubernetes | Multi-node scale-out |
| ASI-Arch adapter | Explicit demand for architecture discovery capability |

---

## Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| M0 | Phase 0 validation complete, upstream behavior confirmed | Week 1 |
| M1 | Monorepo skeleton runs; `/api/tasks` works end-to-end | Week 3–4 |
| M2 | Frontend covers full user flow (create → monitor → result) | Week 6–8 |
| M3 | Phase 3 hardening triggered by real deployment need | TBD |

---

## Technology Stack

### Frontend
- Next.js 14 (App Router, React Server Components)
- React 18, TypeScript 5 (strict mode)
- TailwindCSS + Shadcn/UI
- Zustand (state management), TanStack Query (data fetching)

### Backend
- Python 3.10+
- FastAPI 0.100+ (async, OpenAPI auto-generated)
- SQLAlchemy 2.0+ (ORM)
- Celery 5+ (task queue)
- Redis 7+ (broker/cache)

### AI / ML
- LiteLLM (unified LLM interface — see ADR-003)
- FAISS 1.7+ + sentence-transformers (all-MiniLM-L6-v2, 384-dim)
- Ollama (local model option)

### Infrastructure
- Docker 20+ / Docker Compose 2.0+ (Phase 1–2)
- Kubernetes (Phase 3)

---

## Deployment Modes

| Mode | Description | Target |
|------|-------------|--------|
| Local-first | All computation on-device; no cloud dependency | Developers, privacy-sensitive users |
| Managed cloud | Hosted service; user uploads tasks | General users |
| Private deployment | On-premise for institutions (school, enterprise) | Schools, research labs, enterprises |

---

## License

| Layer | License | Notes |
|-------|---------|-------|
| Core (fork of ASI-Evolve) | Apache-2.0 | Inherited from upstream |
| Application layer (web shell, new adapters, templates) | PolyForm Noncommercial | Source-available; not open-source |

See `LICENSE` file for full boundary definitions.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ASI-Evolve has undocumented dependencies | Medium | High | Phase 0 validates this first |
| LiteLLM API incompatibility | Low | Medium | Thin abstraction layer; swap in one file |
| LLM cost explosion | Medium | Medium | Budget limits per task; model fallback chain |
| Scope creep (adding features before MVP) | High | High | Strict phase gates; no features from later phases |
| Upstream (ASI-Evolve) architecture doesn't map to our services | Medium | Medium | Fork-and-adapt strategy; minimal re-architecture |

---

## Team

For a single-developer initial implementation, the "team roles" collapse:
- Developer = all roles
- Decision-making: Document-first (this plan, ADRs) before code

As the team grows, assign: frontend lead, backend/worker lead, infrastructure/devops.

---

## Reference Documents

| Document | Role |
|---------|------|
| `planning/EXECUTION_PLAN.md` | **Living** implementation plan (this is the most important) |
| `planning/TECHNICAL_ARCHITECTURE.md` | System architecture, API design, data flow |
| `planning/MODULE_BREAKDOWN.md` | Module inventory, dependency graph, interfaces |
| `planning/TECHNICAL_IMPLEMENTATION.md` | Tech stack specifics, Docker Compose, dependency lists |
| `planning/ADR/` | Architecture decision records |
| `prepare/ASI-Evolve-main/` | Primary upstream kernel |
| `prepare/ASI-Arch-main/` | Secondary upstream; specialized capability |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-04-21 | Complete revision. Added Phase 0 validation, MVP-first strategy, three ADRs (SQLite, sandbox deferral, LiteLLM), and structured milestone tracking. Removed over-engineered elements (gVisor, ELK, Kubernetes) from Phase 1–2. |
