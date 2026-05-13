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

---

## Windows Desktop App

A standalone Windows executable is planned for a future release.

### Build from Source

```bash
cd apps/web
npm install --legacy-peer-deps
npm run build:electron

# Output: dist/R U Socrates Setup 0.1.0.exe
```

---

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

## Reasoning Visualization

R U Socrates provides three layers of transparency into the AI research process:

### L1 — Live Reasoning Feed
Real-time stream of every iteration showing:
- **Researcher** → generates candidate solutions with motivations
- **Engineer** → executes and benchmarks code
- **Analyzer** → interprets results and insights

### L2 — Reasoning Tree
Visual tree diagram showing:
- All explored nodes and their parent-child relationships
- Best path highlighted in green
- Currently exploring path in cyan
- Previously explored paths in gray

### L3 — Score Journey
Interactive chart showing:
- Score progression across iterations
- "New best" markers for peak performances
- Improvement tracking

---

## Troubleshooting

### Common Issues

**"API is offline" error in frontend**
Make sure the FastAPI backend is running:
```bash
cd services/api
uvicorn main:app --reload --port 8000
```

**LLM API errors**
1. Verify your API key is set in `services/api/.env`
2. Check the model name is LiteLLM-compatible (e.g., `gpt-4o`, `deepseek-chat`)
3. For local models, ensure Ollama is running: `ollama serve`

**Frontend build fails**
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

**Port already in use**
Change the port in `apps/web/next.config.mjs` or kill the existing process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

---

## Contributing

Contributions are welcome! Please read our [Developer Guide](docs/DEVELOPER_GUIDE.md) for setup instructions and code standards.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/zbbsdsb/R-U-Socrates.git
cd R-U-Socrates

# Install frontend dependencies
npm install
cd apps/web && npm install && cd ../..

# Install backend dependencies
pip install -r services/requirements.txt

# Start development servers
# Terminal 1: API
cd services/api && uvicorn main:app --reload

# Terminal 2: Frontend
cd apps/web && npm run dev
```

---

## License

- Core layer (derived from ASI-Evolve): **Apache-2.0**
- Application layer (new work): **PolyForm Noncommercial**

---

Built with ❤️ by [Oasis Company](https://github.com/zbbsdsb)
