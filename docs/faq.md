# R U Socrates — Frequently Asked Questions

---

## General Information

### Q: What is R U Socrates?
A: R U Socrates is a transparent research engine. It lets you watch AI think in real-time, showing every step of the reasoning process.

### Q: How is it different from other AI tools?
A: Most tools give you a result. R U Socrates shows you the entire process. You see the hypotheses, the experiments, the failures, and the breakthroughs.

### Q: Who is this for?
A: Researchers, developers, educators, students, and anyone curious about how AI works.

---

## Usage Questions

### Q: What LLMs are supported?
A: 100+ models via LiteLLM! Including OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), DeepSeek, and many more.

### Q: Do I need an API key?
A: Yes, you need an API key from a supported LLM provider. You can use multiple providers with fallback.

### Q: How do I configure the LLM?
A: Create a `.env` file in `services/api/` with your API keys. See the [Quick Start Guide](./quick-start-guide.md).

### Q: Can I use local LLMs?
A: Yes! If your local LLM is compatible with OpenAI API format, LiteLLM can use it.

### Q: How does the reasoning tree work?
A: Each node represents an iteration. Color coding:
- 🟢 **Best**: Best solution found so far
- 🟦 **Alive**: Currently exploring
- ⚪ **Pruned**: Not promising, abandoned

### Q: Can I pause a running task?
A: Yes! v0.3.0+ supports pause/resume.

### Q: Can I save and share tasks?
A: Yes, tasks are saved locally. You can export results as Markdown.

### Q: What's the difference between L1, L2, and L3?
A:
- **L1**: Live Reasoning Feed (detailed step-by-step)
- **L2**: Reasoning Tree (exploration map)
- **L3**: Score Journey (performance over time)

---

## Troubleshooting

### Q: The frontend won't start
A:
1. Make sure port 3000 is not in use
2. Delete `node_modules` and `package-lock.json` then `npm install`
3. Check Node.js version (18+ required)

### Q: The backend won't start
A:
1. Make sure port 8000 is not in use
2. Verify Python dependencies: `pip install -r services/requirements.txt`
3. Check your `.env` file has valid API keys

### Q: LLM calls are failing
A:
1. Verify your API key is correct and has quota
2. Try a different model or provider
3. Check LiteLLM documentation for compatibility
4. Check network connectivity and firewalls

### Q: The UI is slow with many nodes
A: Try v0.3.0+ with Tree Virtualization for 100+ node performance.

### Q: I'm getting CORS errors
A: The backend should handle CORS automatically. Make sure the backend is running on port 8000.

### Q: My data isn't being saved
A: Check that SQLite can write to the `data/` directory.

---

## Technical Support

### Q: How do I report a bug?
A: Open a [GitHub Issue](https://github.com/zbbsdsb/R-U-Socrates/issues) with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if possible
- Browser and OS versions

### Q: How do I request a feature?
A: Open a GitHub Issue with the "enhancement" label.

### Q: Is this open source?
A: Yes! Core layer is Apache-2.0, application layer is PolyForm Noncommercial.

### Q: Can I contribute?
A: Absolutely! Check out the [Developer Guide](./developer-guide.md) and [Good First Issues](./good-first-issues.md).

### Q: What browsers are supported?
A: Chrome, Firefox, Safari, and Edge (latest versions).

### Q: Do you have a Discord/Slack community?
A: Not yet, but we're planning one! Star/watch the repo for updates.

---

## Enterprise & Commercial

### Q: Can I use this commercially?
A: Community Edition is for non-commercial use only. Contact us for Enterprise Edition.

### Q: Do you offer SLAs?
A: Yes for Enterprise customers.

### Q: Can I get custom integrations?
A: Yes, Enterprise Edition supports custom integrations.

### Q: Is there an API?
A: Yes! The REST API is documented in the code. Enterprise Edition adds API access.
