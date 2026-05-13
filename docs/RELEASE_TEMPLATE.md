# R U Socrates v0.1.0 — MVP Release

> **The transparent research engine. See how AI thinks — every step, every decision.**

---

## What's New

### 🎯 Complete Reasoning Visualization (ADR-007)

This release completes the three-layer transparency system:

**L1 — Live Reasoning Feed**
- Real-time accordion cards showing every iteration
- Researcher → Engineer → Analyzer stages
- Syntax-highlighted code previews

**L2 — Reasoning Tree**
- SVG visualization of explored nodes
- Best path highlighted in green
- Click to expand iteration details

**L3 — Score Journey**
- Interactive score progression chart
- "New best" markers for peak performances
- Improvement tracking

### 🔧 Technical Improvements

- Fixed 10 critical issues from Phase 1
- Backend SSE events now include `agent_type` field
- Improved node database initialization
- Better error handling and edge cases

### 📚 Documentation

- Complete README with troubleshooting
- Developer Guide for contributors
- Architecture documentation

---

## How to Get Started

```bash
# 1. Clone the repo
git clone https://github.com/zbbsdsb/R-U-Socrates.git
cd R-U-Socrates

# 2. Install dependencies
npm install
cd apps/web && npm install && cd ../..
pip install -r services/requirements.txt

# 3. Configure your LLM
echo "OPENAI_API_KEY=sk-your-key" > services/api/.env

# 4. Start!
cd services/api && uvicorn main:app --reload &
cd apps/web && npm run dev
```

Open http://localhost:3000 and create your first research task!

---

## What's Next

- [ ] Desktop app packaging (Tauri)
- [ ] Template library
- [ ] Custom evaluator scripts
- [ ] Multi-user support

---

## Community

- ⭐ Star us on GitHub
- 🐛 Report bugs via Issues
- 💡 Submit feature requests
- 📖 Read the Developer Guide

---

**Built with ❤️ by [Oasis Company](https://github.com/zbbsdsb)**
