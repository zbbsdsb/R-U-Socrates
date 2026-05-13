# R U Socrates Developer Guide

> This guide covers local development setup, architecture, testing, and code standards for contributors.

---

## Project Structure

```
R U Socrates/
├── apps/
│   └── web/                    # Next.js 14 frontend
│       ├── app/                # App Router pages
│       │   ├── page.tsx       # Home page
│       │   ├── tasks/         # Task management
│       │   ├── results/       # Result display
│       │   ├── settings/      # Settings page
│       │   └── docs/          # Documentation page
│       ├── components/        # React components
│       │   ├── reasoning/     # L1/L2/L3 reasoning visualization
│       │   └── ui/            # Shadcn/UI components
│       ├── services/          # API clients
│       ├── stores/            # Zustand state stores
│       └── lib/               # Utilities
├── services/
│   ├── api/                   # FastAPI backend
│   │   ├── main.py           # App entry point
│   │   ├── routes/           # API routes
│   │   ├── database.py       # SQLite + SQLAlchemy
│   │   ├── models.py         # ORM models
│   │   └── schemas.py        # Pydantic schemas
│   └── worker/               # Research pipeline
│       ├── pipeline.py       # Async generator orchestrator
│       ├── researcher.py     # LLM-powered researcher agent
│       ├── engineer.py       # Code execution agent
│       ├── analyzer.py       # LLM-powered analyzer agent
│       └── memory.py         # FAISS + sentence-transformers
├── packages/
│   └── types/                # Shared TypeScript types
└── planning/                 # Architecture Decision Records
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or pnpm
- An LLM API key (OpenAI, Anthropic, Qwen, Ollama)

### Step 1: Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd apps/web && npm install && cd ../..

# Backend dependencies
pip install -r services/requirements.txt
pip install -r services/api/requirements.txt
pip install -r services/worker/requirements.txt
```

### Step 2: Configure Environment

Create `services/api/.env`:

```env
# Required: LLM API key
OPENAI_API_KEY=sk-your-key-here

# Optional: Model selection (defaults to qwen-plus)
LITELLM_MODEL=gpt-4o-mini
```

### Step 3: Start Development Servers

**Terminal 1 - API Server:**
```bash
cd services/api
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

Open http://localhost:3000

---

## Architecture

### Data Flow

```
User Action → Next.js Frontend → FastAPI (REST/SSE) → Worker Pipeline
                                                           ↓
                                                           ↓
UI Update ←────── SSE Events ←─────────────────────────────↓
```

### Key Components

#### 1. Worker Pipeline (`services/worker/`)

The research loop is an async generator:

```python
async def run(config: RunConfig) -> AsyncGenerator[PipelineEvent, None]:
    """Yields PipelineEvent for every meaningful step."""
```

Pipeline Events:
- `run_started`, `run_complete`, `run_failed`
- `researcher_started`, `researcher_complete`, `researcher_failed`
- `engineer_started`, `engineer_complete`, `engineer_failed`
- `analyzer_started`, `analyzer_complete`, `analyzer_failed`
- `iteration_complete`

#### 2. API Server (`services/api/`)

- **SSE Endpoint**: `/tasks/{task_id}/stream` - streams pipeline events
- **REST Endpoints**: CRUD for tasks and results
- **Database**: SQLite with WAL mode

#### 3. Frontend Store (`apps/web/stores/`)

- `taskStore.ts` - task list and creation
- `reasoningStore.ts` - SSE event processing and iteration data
- `settingsStore.ts` - user preferences

### Reasoning Visualization (ADR-007)

Three layers of transparency:

| Layer | Component | Description |
|-------|-----------|-------------|
| L1 | ReasoningFeed | Live accordion cards per iteration |
| L2 | ReasoningTree | SVG tree of explored nodes |
| L3 | ScoreChart | recharts line chart of scores |

---

## Testing

### Frontend Type Check

```bash
cd apps/web
npm run typecheck
```

### Frontend Lint

```bash
npm run lint
```

### Manual E2E Testing

1. Start both servers
2. Create a new task via UI
3. Verify SSE streaming works
4. Verify result display and export

### Python Imports

```bash
cd services/worker
python -c "from pipeline import run; print('OK')"
```

---

## Code Standards

### TypeScript

- Use strict TypeScript with no `any` types
- Export types from `packages/types/` for shared interfaces
- Use Zustand for state management
- Prefer functional components with hooks

### Python

- Use type hints throughout
- Pydantic models for all API schemas
- Async/await for I/O operations
- Docstrings for public functions

### Commit Messages

Follow Conventional Commits:

```
feat: add reasoning tree visualization
fix: resolve SSE reconnection issue
docs: update developer guide
refactor: simplify iteration store
```

---

## Adding New Features

### 1. New API Endpoint

1. Add route in `services/api/routes/`
2. Add schema in `services/api/schemas.py`
3. Add service logic in `services/api/services/`
4. Add TypeScript types in `packages/types/`
5. Add frontend API client in `apps/web/services/`

### 2. New UI Component

1. Create component in `apps/web/components/`
2. Add to page
3. Add state management if needed
4. Test with real data

### 3. New Pipeline Event

1. Add `EventType` in `services/worker/models.py`
2. Emit event in appropriate agent
3. Handle event in `reasoningStore.ts`
4. Render in appropriate visualization component

---

## Troubleshooting

### "Module not found" errors

```bash
# Reinstall dependencies
cd apps/web && npm install

# For Python, check virtual environment
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r services/requirements.txt
```

### Database issues

```bash
# Delete and recreate database
rm -f services/api/data/rus.db
```

### SSE not streaming

1. Check browser console for errors
2. Verify API server is running
3. Check network tab for SSE connection

---

## License

- Core layer (ASI-Evolve fork): **Apache-2.0**
- Application layer: **PolyForm Noncommercial**

---

For questions, open an issue on GitHub or reach out to the maintainers.
