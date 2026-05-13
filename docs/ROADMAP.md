# R U Socrates — Roadmap & Optimization Plan

---

## ✅ v0.2.0 — MVP Complete (Current)

**Release Date:** 2026-05-13

**What's included:**
- Full L1/L2/L3 reasoning visualization
- Complete documentation
- Community-ready release

---

## 📈 v0.3.0 — Polish & Performance (Q2 2026)

### Priority: High

#### 1. Performance Optimizations
- [ ] **Reasoning Tree Virtualization** — for deep trees (>50 nodes), use react-window / react-virtual to avoid DOM bloat
- [ ] **SSE Debouncing** — throttle high-frequency events to prevent UI jank
- [ ] **FAISS Index Warmup** — pre-load embedding model in background on API startup
- [ ] **Code Splitting** — split reasoning visualization components for faster initial load

#### 2. UX Polish
- [ ] **Task Pause/Resume** — persist in-progress tasks across browser refresh
- [ ] **Keyboard Shortcuts** — `Space` to pause/resume, `Escape` to cancel
- [ ] **Dark Theme Refinement** — better contrast for visualization nodes
- [ ] **Loading Skeletons** — for slow API responses

#### 3. Error Handling
- [ ] **LLM Provider Fallback** — auto-try next model if primary fails
- [ ] **Better Error UI** — non-intrusive toasts + debug modal with stack trace
- [ ] **Offline Mode** — show cached results when API unreachable

### Priority: Medium

- [ ] **Custom Evaluator UI** — let users edit evaluator.py via web interface
- [ ] **Task Templates Gallery** — built-in templates for common use cases
- [ ] **Export to Markdown/PDF** — improved report export

---

## 🎯 v0.4.0 — Desktop App (Q3 2026)

### Features

- [ ] **Electron Build** — package as native .app/.exe
- [ ] **System Tray** — run in background
- [ ] **Auto-Update** — Electron auto-updater
- [ ] **File Watcher** — watch for changes to user scripts

---

## 🏗️ v0.5.0 — Multi-User & Cloud (Q4 2026)

### Features

- [ ] **PostgreSQL Option** — optional PostgreSQL backend (SQLite remains default)
- [ ] **Litestream Sync** — optional S3 backup for SQLite
- [ ] **Basic Auth** — simple password protection
- [ ] **Task Sharing** — share results via public URL (opt-in)

---

## 🚀 v1.0.0 — 1.0 Release (Q1 2027)

### Features

- [ ] **Stable API** — no breaking changes
- [ ] **Plugin System** — third-party evaluators/researchers
- [ ] **Localization** — i18n support
- [ ] **Comprehensive Test Suite** — >80% coverage

---

## 📊 Technical Debt & Optimization Backlog

### Frontend
- [ ] Migrate from Zustand to Jotai for better TypeScript inference
- [ ] Replace custom SVG tree with `react-d3-tree` or `vis-network`
- [ ] Add ESLint rules and pre-commit hooks
- [ ] Add unit tests for reasoning components

### Backend
- [ ] Add Pydantic v2 validation
- [ ] Add structured logging (structlog)
- [ ] Add rate limiting for LLM calls
- [ ] Add Prometheus metrics endpoint

---

## 🎨 Design Improvements

- [ ] Design System audit — consistent spacing/colors
- [ ] Accessibility (a11y) — keyboard navigation, screen reader support
- [ ] Mobile responsive — fix landscape/portrait issues

---

## 📝 Release Checklist Template

### For every release:

- [ ] Update CHANGELOG.md
- [ ] Run full E2E test locally
- [ ] Update version in package.json / pyproject.toml
- [ ] Git tag: `git tag -a vX.X.X -m "vX.X.X"`
- [ ] Push tags: `git push origin --tags`
- [ ] Create GitHub Release using docs/RELEASE_TEMPLATE.md
