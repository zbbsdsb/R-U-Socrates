# R U Socrates: Making AI Research Transparent, One Step at a Time

> **The transparent research engine.** See how AI thinks — every step, every decision.

AI has a transparency problem. When you ask a tool to optimize an algorithm, explore an architecture, or improve a system, you get a polished answer — but you never see *how* it got there. The reasoning is hidden behind a black box.

That’s why we built **R U Socrates** — a research engine that doesn’t just give you answers, but shows you the entire thinking process. Every hypothesis, every evaluation, every insight. All in real time.

---

## The Vision: Transparency Over Conclusions

Our core belief is simple: **the process matters more than the result**. When you watch AI research unfold, you don’t just get a solution — you understand *why* it works, *how* it got better, and *what* mistakes were made along the way.

This isn’t just about accountability. It’s about inspiration. When you see the AI trying ideas you never thought of, analyzing failures you would have missed, and iterating toward a better solution, you learn. You become a better researcher, engineer, and thinker.

---

## The Architecture: Built for Transparency

R U Socrates is designed from the ground up to make research visible. Let’s break down the stack:

### Frontend: Next.js + Real-Time Streaming

The user interface is built with **Next.js 14** and **React 18**, using **Tailwind CSS** and **Shadcn/UI** for a clean, modern look. But the magic is in the real-time streaming.

Instead of polling for updates, the frontend connects to the backend via **Server-Sent Events (SSE)**. As the AI research loop runs, every step is streamed to your screen instantly — no refresh, no delay.

```
┌─────────────────────────────────────────────────────────┐
│  R U Socrates — Live Research Feed                     │
├─────────────────────────────────────────────────────────┤
│  Iteration 1  🔬 Researcher  💻 Engineer  📊 Analyzer  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Motivation: "Let's try a greedy approach first..."│  │
│  └───────────────────────────────────────────────────┘  │
│  Iteration 2  🔬 Researcher  💻 Engineer  📊 Analyzer  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Score improved! +12.3%                            │  │
│  └───────────────────────────────────────────────────┘  │
│  ... (live streaming in real time)                      │
└─────────────────────────────────────────────────────────┘
```

*[Screenshot placeholder: Live reasoning feed showing multiple iterations]*

### Backend: FastAPI + Async Pipeline

The backend is powered by **FastAPI**, a modern Python framework for building APIs. It handles:

- Task management (create, list, delete)
- Real-time event streaming via SSE
- Persistence with **SQLite** (simple, local-first)

The research pipeline itself is a pure Python async generator. It runs the loop and emits events as they happen, which FastAPI then streams to the frontend.

### LLM Interface: LiteLLM

We don’t want to lock you into a single model provider. That’s why we use **LiteLLM** — a unified interface that works with 100+ models, including:

- OpenAI (GPT-4o, GPT-3.5)
- Anthropic (Claude)
- Alibaba Qwen
- DeepSeek
- Local models via Ollama

Just plug in your API key, choose your model, and R U Socrates handles the rest.

### Vector Memory: FAISS + Sentence-Transformers

To make the research loop smart, we need to remember what worked and what didn’t. That’s where **FAISS** (Facebook AI Similarity Search) comes in. It’s a fast, efficient vector database that stores:

- Past experiments and their results
- Insights distilled from failures
- Domain knowledge relevant to your task

When the Researcher generates a new candidate, it retrieves relevant past experiments and builds on what it learned. No more reinventing the wheel.

---

## L1, L2, L3: Three Layers of Reasoning Visualization

Transparency isn’t just about showing data — it’s about making it *legible*. That’s why we built three layers of visualization, each building on the last.

### L1: Live Reasoning Feed

The first layer is the **Live Reasoning Feed** — a real-time stream of every step in the research loop. For each iteration, you see:

- **Researcher**: Generates a new candidate solution with motivation
- **Engineer**: Executes and evaluates the candidate, measuring performance
- **Analyzer**: Interprets results and distills reusable insights

Each step is rendered as a distinct panel with syntax-highlighted code, PASS/FAIL badges, and score changes. You can expand any iteration to dive deeper, or keep them collapsed to see the big picture.

```
┌─ Iteration 5 ─────────────────────────────────────────────────┐
│ 🔬 Researcher  💻 Engineer  📊 Analyzer  best 87.2%  ↑+5.1% │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 🔬 Researcher                                              │ │
│ │  Motivation: "Let's try adding early stopping to prevent   │ │
│ │  overfitting..."                                           │ │
│ │                                                             │ │
│ │ 💻 Engineer                                                │ │
│ │  ✓ PASS  Runtime: 0.42s                                    │ │
│ │  Code: [syntax-highlighted Python snippet]                 │ │
│ │                                                             │ │
│ │ 📊 Analyzer                                                │ │
│ │  Score: 87.2%  Δ +5.1%  (new best!)                       │ │
│ │  "Early stopping reduced overfitting by 12%, improving     │ │
│ │  generalization to unseen test cases."                     │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

*[Screenshot placeholder: Expanded L1 reasoning feed showing all three agents]*

### L2: Reasoning Tree

The second layer is the **Reasoning Tree** — a visual diagram showing how the AI explored different solutions. It looks like this:

```
                    [root]
                    initial approach
                   /          \
            [v1] 73.2%    [v2] 68.1%
           /    \            |
      [v1.1]    [v1.2]    [v2.1]
       ★best    ✗ pruned   70.3%
```

- **Best so far**: Gold star, green highlight
- **Currently exploring**: Cyan highlight
- **Pruned branches**: Gray, dashed
- **Alive nodes**: Solid border

Click any node to jump straight to its iteration in the L1 feed. It’s like having a map of the AI’s exploration journey.

*[Screenshot placeholder: L2 reasoning tree with multiple branches]*

### L3: Score Journey

The third layer is the **Score Journey** — an interactive chart showing how the score improved over time.

```
Score (%)
  100 ────────────────────────★──────────  best: 87.2%
   80 ───────★─────────────────
   60 ────────────✗ (pruned)
      ────────────────────────────────────────────────
       I1    I2    I3    I4    I5    I6    I7  (Iterations)
```

Features:
- Filled area chart with green gradient
- "New best" markers with star annotations
- Hover tooltips showing full iteration details
- Best score callout box

It’s incredibly satisfying to watch the score climb as the AI iterates.

*[Screenshot placeholder: L3 score journey chart with improvements]*

---

## Why This Matters for Research Transparency

Transparent AI research isn’t just a nice-to-have — it’s essential. Here’s why:

### 1. You Can Trust the Result

When you see every step, you don’t have to take the AI’s word for it. You can verify the code, check the evaluation methodology, and confirm that the score improvement is real.

### 2. You Learn From the Process

The AI might try approaches you never thought of. Watching it iterate teaches you new techniques, helps you avoid common pitfalls, and inspires your own research.

### 3. You Can Reproduce the Work

Every step is documented, so you can reproduce the exact same results. That’s the foundation of good science — and good engineering.

### 4. You Stay in Control

Instead of waiting for a black box to finish, you can watch the loop run, pause it if you see something interesting, and steer the research in a new direction.

---

## Get Started Today

Ready to see AI research unfold before your eyes? Here’s how to get started:

### Prerequisites

- Node.js 18+ and Python 3.10+
- An LLM API key (OpenAI, Anthropic, Qwen, or any LiteLLM-compatible provider)

### Quick Start

1. **Install dependencies**:
   ```bash
   git clone https://github.com/zbbsdsb/R-U-Socrates.git
   cd R-U-Socrates
   npm install
   pip install -r services/requirements.txt
   ```

2. **Configure your LLM**:
   Create `services/api/.env` with your API key:
   ```env
   OPENAI_API_KEY=sk-...
   # or
   ANTHROPIC_API_KEY=sk-ant-...
   # or
   DASHSCOPE_API_KEY=sk-...
   ```

3. **Start the servers**:
   - Terminal 1 (API):
     ```bash
     cd services/api
     uvicorn main:app --reload --port 8000
     ```
   - Terminal 2 (Frontend):
     ```bash
     cd apps/web
     npm run dev
     ```

4. **Create your first task**:
   Open `http://localhost:3000`, click **New Task**, describe what you want to optimize, and watch the loop run!

---

## What’s Next?

We’re just getting started. Here’s what’s on our roadmap:

- **Desktop app**: Standalone Windows executable with Electron
- **More templates**: Pre-built tasks for common optimization problems
- **Export to PDF**: Save your research journey as a shareable report
- **Collaboration**: Work together with your team on research tasks

Follow us on GitHub to stay updated!

---

## Built With ❤️ by Oasis Company

R U Socrates is open source and free to use (non-commercial). We believe that transparent AI research should be accessible to everyone.

If you have ideas, feedback, or just want to say hi, we’d love to hear from you! Open an issue on GitHub or reach out to us.

---

*[Screenshot placeholder: Full R U Socrates UI with all three layers visible]*
