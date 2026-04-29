# R U Socrates

> **The transparent research engine.** See how AI thinks — every step, every decision.

R U Socrates makes the AI research process visible. Instead of getting a black-box answer, you watch a loop of specialized agents — Researcher, Engineer, Analyzer — iterating in real time. Every hypothesis, every evaluation, every insight is streamed to your screen.

---

## What It Does

Most AI tools hide their reasoning. R U Socrates doesn't.

You give it a research task (optimize an algorithm, explore an architecture, improve a system). It runs a multi-agent loop and lets you observe:

- **Researcher** — generates a new candidate solution based on prior attempts and lessons learned
- **Engineer** — executes and evaluates the candidate, measuring performance
- **Analyzer** — interprets results and distills reusable insights for the next iteration

Every step is streamed live. You see the code, the scores, the analysis — as it happens.

---

## Quick Start

### Prerequisites

- Node.js 18+ and Python 3.10+
- An LLM API key (OpenAI, Anthropic, Qwen, Ollama, or any LiteLLM-compatible provider)

### 1. Install frontend dependencies

```bash
npm install
cd apps/web && npm run dev
# Open http://localhost:3000
```

### 2. Install backend dependencies

```bash
pip install -r services/requirements.txt
```

### 3. Configure your LLM

Create `services/api/.env`:

```env
# For OpenAI
OPENAI_API_KEY=sk-...

# For Qwen (Alibaba DashScope)
DASHSCOPE_API_KEY=sk-...

# For Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Start the API

```bash
cd services/api
uvicorn main:app --reload --port 8000
```

### 5. Create your first task

Open `http://localhost:3000`, click **New Task**, describe what you want to optimize, and watch the loop run.

---

## Architecture

```
apps/web/          Next.js 14 frontend — task list, live reasoning feed, results
services/api/      FastAPI — REST + SSE streaming
services/worker/   Research pipeline — Researcher / Engineer / Analyzer loop
packages/types/    Shared TypeScript types
```

The pipeline is a pure Python async generator. FastAPI streams its events via Server-Sent Events (SSE). The frontend connects with `EventSource` and renders each event as it arrives — no polling, no refresh.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS, Shadcn/UI, Zustand |
| Backend | Python 3.10+, FastAPI, SQLAlchemy, SQLite |
| LLM Interface | LiteLLM (100+ models, one interface) |
| Vector Memory | FAISS + sentence-transformers |
| Code Execution | subprocess + timeout (no Docker required) |

---

## License

- Core layer (derived from ASI-Evolve): **Apache-2.0**
- Application layer (new work): **PolyForm Noncommercial**

---

Built with ❤️ by [Oasis Company](https://github.com/zbbsdsb)
