# Changelog

## v0.1.0 — 2026-04-29

First public release of R U Socrates — the transparent research engine.

### ✨ Features

**Frontend (Next.js 14)**
- Landing page with hero section, research loop preview, how-it-works, and use cases
- Task list with real-time status, create/stop/delete actions, template prefill
- Task detail page with breadcrumb navigation and live reasoning feed
- **L1 Live Reasoning Feed** — real-time SSE panel streaming Researcher → Engineer → Analyzer events
  - IterationAccordion: collapsible per-iteration view
  - ResearcherCard: generated code preview with Shiki syntax highlighting (10 languages)
  - EngineerCard: execution results, score, runtime
  - AnalyzerCard: AI analysis with Socratic reflection
  - Auto-scroll with "New events" floating button
- Score card showing best score, total nodes, iterations
- Settings page with LLM provider configuration and connection testing
- Docs page
- Toast notification system
- Dark / light / system theme toggle
- Lucide icon system throughout (no inline SVGs)

**Backend (FastAPI + Python)**
- REST API: create, list, get, delete, cancel tasks
- SSE streaming endpoint: real-time pipeline events
- Research pipeline: Researcher / Engineer / Analyzer async loop
- LiteLLM integration: 100+ models, single interface
- FAISS + sentence-transformers vector memory (lazy-init)
- SQLite database with WAL mode
- Default evaluator: subprocess-based scoring with heuristics

### 🐛 Bug Fixes

- Fixed `cancel_task` async bug: replaced `get_event_loop().run_until_complete()` with `loop.create_task()` to avoid RuntimeError in FastAPI context
- Fixed `CognitionStore` eager initialization: now lazy-inits EmbeddingService and FAISSIndex on first use (prevents blocking API startup)
- Fixed `NodeDatabase.sample()` unnecessary disk write on every iteration
- Added missing `evaluator.py` — previously caused every run to produce score=0.0

### 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS, Shadcn/UI, Zustand, Shiki |
| Backend | Python 3.10+, FastAPI, SQLAlchemy 2.0, SQLite |
| LLM | LiteLLM (OpenAI, Anthropic, Qwen, Ollama, …) |
| Memory | FAISS 1.8 + sentence-transformers |
| Streaming | Server-Sent Events (SSE) |

### ⚠️ Known Limitations

- Single-user local deployment only (no auth, no multi-tenancy)
- SQLite only (PostgreSQL planned for Phase 3)
- No Docker / sandbox isolation for code execution (process exec + timeout)
- L2 Reasoning Tree and L3 Score Journey not yet implemented (planned)
- FAISS model download (~200 MB) happens on first run
- Docker support: standalone Dockerfile + docker-compose.yml for development

### 📄 License

- Core layer (derived from ASI-Evolve): Apache-2.0
- Application layer: PolyForm Noncommercial
