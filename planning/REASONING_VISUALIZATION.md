# Reasoning Visualization — Implementation Plan

**Feature:** ADR-007 — Three-Layer Reasoning Visualization
**Owner:** ceaserzhao / AI assistant
**Started:** 2026-04-25
**Target:** Phase 1 (Live Reasoning Feed) ships in current sprint

---

## Overview

This plan covers implementation of R U Socrates's core product feature: making the AI research reasoning process transparent and legible to non-technical users.

Three layers, increasing depth:

| Layer | Name | Scope | Effort |
|-------|------|-------|--------|
| **L1** | Live Reasoning Feed | Real-time SSE panel on Task Detail page | ~4h |
| **L2** | Reasoning Tree | Node exploration tree (SVG/d3) | ~3h |
| **L3** | Score Journey | Iteration score chart (recharts) | ~2h |

L1 is the critical path. L2 and L3 can be built in parallel once L1's data layer is stable.

---

## Prerequisites

### Backend: SSE `event.type` Field

**File:** `services/worker/pipeline.py` (or wherever `PipelineEvent.to_sse_dict()` is called)

The SSE stream must emit events with a `type` field that reflects the current pipeline step:

```python
# pipeline.py — in each step's event emission
def _emit(self, step: str, **kwargs):
    self.events.append({
        "type": step,  # "researcher" | "engineer" | "analyzer"
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs,
    })
```

**Current state:** `PipelineEvent.to_sse_dict()` in `models.py` exists but `type` field may not be set per step. Verify by checking `services/worker/models.py`.

**Action:** 1-line change per step + test with `curl http://localhost:8000/api/tasks/{id}/stream`.

---

## Phase 1: Live Reasoning Feed (L1)

### 1.1 Component Architecture

```
apps/web/components/reasoning/
├── ReasoningFeed.tsx        # Container, SSE subscription, event accumulation
├── IterationCard.tsx        # Single iteration accordion (collapsed by default)
├── StepPanel.tsx            # Researcher / Engineer / Analyzer sub-block
├── CodePreview.tsx          # Syntax-highlighted code block
├── EvalResult.tsx           # PASS/FAIL badge + runtime + stdout snippet
├── ScoreBadge.tsx          # Score + delta chip (green/red)
└── PrunedNodeRow.tsx        # Collapsed row for pruned branches
```

### 1.2 Data Layer

**`stores/reasoningStore.ts`** (Zustand):

```typescript
interface ReasoningStore {
  events: PipelineEvent[];
  currentIteration: number;
  bestScore: number;
  scoreHistory: { iteration: number; score: number }[];

  addEvent: (e: PipelineEvent) => void;
  reset: () => void;
}
```

The store accumulates events as they arrive via SSE. Both L1 (feed) and L2 (tree) consume from this store.

### 1.3 Existing `tasks/[id]/page.tsx` Integration

Current implementation:
- Uses `subscribeToRun()` from `taskService.ts`
- Renders events as raw `<pre>` lines

**Replacement strategy:** Extract SSE logic into `ReasoningFeed`, keep the outer page shell (header, stats, breadcrumb, Export button).

### 1.4 Code Syntax Highlighting

Use `shiki` (VS Code's highlighter) for browser-side highlighting:

```bash
cd apps/web
npm install shiki
```

Shiki runs client-side only (no SSR) to avoid hydration issues. Wrap in `useEffect` with `onMount` guard.

Supported themes: `github-dark`, `github-light` — synced with the app's theme toggle.

### 1.5 Event Accumulation & Scroll

- New events append to the bottom; auto-scroll to latest
- User scrolls up → pause auto-scroll; show "↓ New events" floating button
- Use `react-intersection-observer` to detect scroll position

### 1.6 Acceptance Criteria

- [ ] Every SSE event type (`researcher` / `engineer` / `analyzer`) renders as a distinct step panel
- [ ] Iteration card shows score delta (green ↑ / red ↓) from previous iteration
- [ ] Code block uses shiki with current theme
- [ ] Pruned nodes appear as collapsed red rows
- [ ] Auto-scroll works; manual scroll shows "New events" button
- [ ] Page stays responsive with 50+ iterations accumulated (virtual scroll if needed)

---

## Phase 2: Reasoning Tree (L2)

### 2.1 Data Layer Extension

L2 requires reconstructing the node tree from accumulated `PipelineEvent`s. Each event that creates a new node captures:

```typescript
interface NodeSnapshot {
  id: number;
  parentId: number | null;
  name: string;
  motivation: string;
  score: number;
  status: "alive" | "pruned" | "best";
}
```

Compute `children[]` client-side by building a `parentId → children[]` map from the event stream.

**No backend changes required** — the tree is reconstructed entirely from SSE events.

### 2.2 Rendering

Option A — **d3-hierarchy + SVG**: Full control, requires `d3` (~90kb). Good for complex tree layouts.

Option B — **Recursive component + CSS flexbox**: Zero deps, easier to style. Suitable if the tree is not too deep (< 10 levels).

**Decision:** Start with Option B. If tree grows deep, migrate to d3.

### 2.3 Interaction

- Click node → expand its iteration card in L1 panel (scroll + highlight)
- Hover → tooltip with name, score, status
- "Expand all" / "Collapse all" toggle

### 2.4 Acceptance Criteria

- [ ] Tree correctly reflects node parent/child relationships
- [ ] Alive / pruned / best states are visually distinct
- [ ] Clicking a node scrolls to its iteration card
- [ ] Tree updates live as new nodes appear

---

## Phase 3: Score Journey (L3)

### 3.1 Chart Library

Use `recharts` — React-native, tree-shakeable, works well in Next.js.

```bash
cd apps/web
npm install recharts
```

### 3.2 Data

`scoreHistory` from `reasoningStore.ts` — already being accumulated in L1.

### 3.3 Design

```
Score (%)
  |
100 ────────────── ★ I6 best
  |            ★ I4 best
  |       ★ I2 best
  |
  0 ────────────────────────────
       I1   I2   I3   I4   I5   I6  (Iterations)
```

Features:
- Filled area chart (green gradient)
- Dashed line on pruned iterations
- Annotation for "new best" moments
- Hover tooltip: iteration number, score, node name
- Best score callout box on the right

### 3.4 Acceptance Criteria

- [ ] Chart renders from accumulated `scoreHistory` in real time
- [ ] "New best" annotations appear when `best_score` increases
- [ ] Hover shows full iteration details
- [ ] Chart is responsive (mobile-friendly)

---

## Dependency Graph

```
Backend: add event.type to SSE
    │
    ▼
L1: ReasoningFeed (data layer + SSE subscription)
    │
    ├── L2: Reasoning Tree (consumes same store)
    └── L3: Score Journey (consumes scoreHistory)
```

---

## File Manifest

### New files

```
apps/web/
├── components/
│   └── reasoning/
│       ├── ReasoningFeed.tsx       # L1 container
│       ├── IterationCard.tsx       # L1 accordion
│       ├── StepPanel.tsx            # L1 step block
│       ├── CodePreview.tsx          # L1 shiki code
│       ├── EvalResult.tsx           # L1 eval badge
│       ├── ScoreBadge.tsx          # L1 score chip
│       ├── PrunedNodeRow.tsx       # L1 pruned row
│       ├── ReasoningTree.tsx       # L2 tree
│       ├── TreeNode.tsx            # L2 recursive node
│       └── ScoreChart.tsx          # L3 recharts chart
└── stores/
    └── reasoningStore.ts           # Shared state (Zustand)
```

### Modified files

```
apps/web/app/tasks/[id]/
└── page.tsx                        # Replace raw <pre> feed with ReasoningFeed
```

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Does `pipeline.py` already emit step-type events? | Verify |
| 2 | Is shiki SSR-safe in Next.js App Router? | Use `dynamic(() => import(...), { ssr: false })` |
| 3 | How deep can the tree grow? Should we virtualize? | Plan B (CSS tree) first; d3 if > 20 nodes |

---

## Next Step

Verify backend SSE event types in `services/worker/models.py` / `pipeline.py`. If `type` field is missing, add it before starting L1 frontend work.
