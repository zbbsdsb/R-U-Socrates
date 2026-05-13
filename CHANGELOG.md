# Changelog

## v0.2.0 — 2026-05-13

**MVP Complete & Community Launch** — Full reasoning visualization and production-ready documentation.

### ✨ Features

**Frontend (Next.js 14)**
- **L2 Reasoning Tree** — SVG-based visualization with:
  - Color-coded node statuses: Alive (cyan), Best (green), Pruned (gray)
  - Interactive clickable nodes showing iteration details
  - Auto-layout D3-like tree with parent-child connections
  - Scrollable viewport for deep trees
- **L3 Score Journey** — Recharts-powered line chart:
  - Gradient area fill showing score trend
  - "New best" amber markers at peak scores
  - Custom tooltips with iteration details
  - Summary stats (Final Score, New Bests, Improvement %)
- **Documentation**
  - [Developer Guide](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/docs/DEVELOPER_GUIDE.md): complete setup, architecture, and contribution guide
  - [Release Template](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/docs/RELEASE_TEMPLATE.md): GitHub release notes template
  - Updated [README](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/README.md) with troubleshooting and contributing sections

### 📦 Updates

- Added `recharts` dependency to `apps/web/package.json`
- Integrated L2/L3 components into task detail page
- Theme colors updated for better visualization contrast

### 🚀 Release Readiness

- ✅ Full MVP feature set: L1/L2/L3 visualization complete
- ✅ Complete developer documentation
- ✅ Release templates and changelog maintained
- ✅ Contributing guide for community onboarding

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
