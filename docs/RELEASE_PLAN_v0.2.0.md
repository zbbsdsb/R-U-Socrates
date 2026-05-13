# R U Socrates v0.2.0 — Release Plan

**Version:** v0.2.0
**Codename:** "Socrates Speaks"
**Target Date:** 2026-05-13
**Type:** Minor Release (MVP Complete)

---

## 🎯 Release Goals

✅ **MVP Complete** — All three layers of reasoning visualization implemented
✅ **Community Ready** — Complete documentation and onboarding materials
✅ **Production Ready** — Stable enough for early adopters

---

## 📋 Pre-Release Checklist

### Step 1: Manual E2E Test (Mandatory)

- [ ] Start backend API: `cd services/api && uvicorn main:app --reload --port 8000`
- [ ] Start frontend: `cd apps/web && npm install && npm run dev`
- [ ] Open http://localhost:3000
- [ ] Create a new task (e.g., "Write a Python script to calculate Pi")
- [ ] Verify L1 Live Reasoning Feed updates in real-time
- [ ] Verify L2 Reasoning Tree shows nodes with correct colors
- [ ] Verify L3 Score Journey chart updates with iterations
- [ ] Wait for task completion, verify Result page shows up
- [ ] Verify Markdown export works

### Step 2: Final Code Cleanup

- [ ] Ensure no `console.log` or debug prints remain
- [ ] Run type check: `cd apps/web && npx tsc --noEmit`
- [ ] Verify `apps/web/package.json` has correct dependencies (`recharts` present)

### Step 3: Git Operations

```bash
# Check git status
git status

# Add changes
git add apps/web/components/reasoning/
git add apps/web/app/tasks/[id]/page.tsx
git add apps/web/package.json
git add CHANGELOG.md
git add planning/EXECUTION_PLAN.md
git add docs/

# Commit (use English message)
git commit -m "feat: complete L2 Reasoning Tree and L3 Score Journey
- Add SVG-based ReasoningTree component with color-coded nodes
- Add Recharts-powered ScoreChart with gradient and new-best markers
- Integrate L2/L3 into task detail page
- Add complete documentation (Developer Guide, Roadmap, Release Plan)
- Update CHANGELOG for v0.2.0"

# Create tag
git tag -a v0.2.0 -m "v0.2.0 — MVP Complete & Community Launch"

# Push (including tags)
git push origin main
git push origin v0.2.0
```

### Step 4: GitHub Release

- [ ] Go to GitHub → Releases → Draft a new release
- [ ] Use `docs/RELEASE_TEMPLATE.md` as the release notes
- [ ] Tag version: `v0.2.0`
- [ ] Release title: `v0.2.0 — MVP Complete & Community Launch`
- [ ] Check "Set as a pre-release" if needed, otherwise "Set as the latest release"
- [ ] Publish!

---

## 📦 What's in v0.2.0

### ✨ New Features

| Feature | File |
|---------|------|
| L2 Reasoning Tree | [ReasoningTree.tsx](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/components/reasoning/ReasoningTree.tsx) |
| L3 Score Journey | [ScoreChart.tsx](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/components/reasoning/ScoreChart.tsx) |
| Developer Guide | [DEVELOPER_GUIDE.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/docs/DEVELOPER_GUIDE.md) |
| Roadmap | [ROADMAP.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/docs/ROADMAP.md) |
| Release Plan | This file |
| Release Template | [RELEASE_TEMPLATE.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/docs/RELEASE_TEMPLATE.md) |

### 📝 Updated Files

| File | Changes |
|------|---------|
| [CHANGELOG.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/CHANGELOG.md) | Added v0.2.0 section |
| [planning/EXECUTION_PLAN.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/planning/EXECUTION_PLAN.md) | Updated status to MVP complete |
| [README.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/README.md) | Added troubleshooting & contributing sections |
| [apps/web/package.json](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/package.json) | Added `recharts` dependency |
| [apps/web/app/tasks/[id]/page.tsx](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/app/tasks/[id]/page.tsx) | Integrated L2/L3 components |

---

## 🎨 Release Notes (Preview)

### Highlights

- **Complete Reasoning Visualization** — L1 Live Feed + L2 Reasoning Tree + L3 Score Journey
- **Production Documentation** — Developer Guide, Roadmap, and onboarding materials
- **Community Ready** — Contributing guide and release templates

---

## 🚀 Post-Release

### Next Steps (v0.3.0)

See [ROADMAP.md](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/docs/ROADMAP.md) for full plan:
- Performance optimizations (tree virtualization, SSE debouncing)
- UX polish (pause/resume, keyboard shortcuts)
- Error handling improvements
