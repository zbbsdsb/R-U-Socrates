# R U Socrates — Product Landing Page

> **The Transparent Research Engine**  
> Watch AI think, every step of the way.

---

## 🎯 Why R U Socrates?

Most AI tools give you a black box result. R U Socrates shows you the entire reasoning process, so you can understand, verify, and learn.

### **Transparency over Conclusions**
Instead of just getting an answer, watch a multi-agent system:
- 🔍 **Researcher**: Generate and explore hypotheses
- 🛠️ **Engineer**: Execute and evaluate experiments
- 💡 **Analyzer**: Learn from results and improve

---

## ✨ Key Features

### **L1: Live Reasoning Feed**
Real-time streaming of every step in the research process.
- Watch each iteration unfold
- See the code being written and executed
- Follow the analysis and insights
- Syntactic highlighting for 10+ languages

### **L2: Reasoning Tree**
Visual map of all explored paths.
- Color-coded nodes (Alive/Best/Pruned)
- Interactive, clickable tree
- Understand the exploration strategy
- Learn from both successes and failures

### **L3: Score Journey**
Track performance over time.
- Smooth, interactive chart
- "New Best" markers highlight breakthroughs
- See improvement trends
- Understand the optimization landscape

---

## 🚀 Get Started

### **Web Version**
1. Clone the repo: `git clone https://github.com/zbbsdsb/R-U-Socrates.git`
2. Install dependencies: `cd apps/web && npm install`
3. Start frontend: `npm run dev`
4. Start backend: `cd services/api && python -m uvicorn main:app --reload --port 8000`

### **Desktop App (Coming Soon)**
Download native Windows/macOS application.

---

## 📊 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS, Recharts |
| Backend | Python 3.10+, FastAPI, SQLAlchemy, SQLite |
| LLM Integration | LiteLLM (supporting 100+ models) |
| Vector Memory | FAISS + sentence-transformers |

---

## 💡 Use Cases

- **Researchers**: Understand AI research methodology
- **Developers**: Debug and learn from AI experiments
- **Educators**: Teach AI reasoning processes
- **Curious Minds**: Watch AI think, in real-time

---

## 📚 Documentation

- [README](../README.md) — Quick start guide
- [Developer Guide](./developer-guide.md) — Architecture and contributing
- [FAQ](./faq.md) — Common questions
- [Roadmap](./roadmap.md) — Future plans

---

## 🤝 Community & Contributing

Contributions welcome! Check out our [good first issues](../docs/good-first-issues.md) to get started.

---

## 📄 License

- Core layer (derived from ASI-Evolve): Apache-2.0
- Application layer (new work): PolyForm Noncommercial
