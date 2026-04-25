# ADR-007 — Reasoning Visualization: Three-Layer Architecture

**Date:** 2026-04-25
**Status:** Accepted
**Decider:** ceaserzhao

---

## Context

R U Socrates's core value proposition is **transparency over conclusions** — the user watches the reasoning process unfold, not a finished answer. The current Results page shows only the final best node; the running Task Detail page shows a raw event log. Neither makes the reasoning process genuinely legible to a non-technical user.

The question: how do we visualize ASI-Evolve's **Researcher → Engineer → Analyzer** loop so it is simultaneously accurate (faithful to the pipeline) and comprehensible (legible to a human)?

---

## Decision

Implement reasoning visualization in three layers, each building on the last:

| Layer | Name | Description | Frontend-only? |
|-------|------|-------------|----------------|
| **L1** | Live Reasoning Feed | Real-time SSE panel on Task Detail, showing each pipeline step as it happens | Yes |
| **L2** | Reasoning Tree | Collapsible exploration tree showing node branching and pruning history | Yes |
| **L3** | Score Journey | Iteration-over-iteration score chart with annotations for key decisions | Yes |

All three layers consume the same data source (`PipelineEvent` SSE stream). No new backend data structures required for L1–L2.

---

## Layer 1: Live Reasoning Feed

### Data Contract (from `PipelineEvent`)

```typescript
interface PipelineEvent {
  type: "researcher" | "engineer" | "analyzer" | "node_pruned" | "run_complete" | "run_failed";
  iteration: number;
  node_name: string;
  node_motivation: string;     // researcher output
  node_code_preview: string;    // engineer output
  analysis: string;             // analyzer output
  eval_score: number;
  eval_success: boolean;
  eval_runtime: number;
  eval_stdout_preview: string;
  best_score: number;
  best_node_id: number | null;
  total_nodes: number;
  timestamp: string;
}
```

**Backend requirement:** `event.type` must be set to `"researcher"`, `"engineer"`, or `"analyzer"` at the appropriate moment in the pipeline. This is a single-line change in `pipeline.py`.

### UX Design

Each iteration renders as a **collapsed accordion card** in the SSE panel:

```
┌─ Iteration 3 ─────────────────────────────────────────────────┐
│ 🔬 Researcher  💻 Engineer  📊 Analyzer         best 72.3%  │
│ ▶ [collapsed: "探索单调栈边界 case..."]                        │
└───────────────────────────────────────────────────────────────┘
```

Expanded state:
```
│ 🔬 Researcher                                              │
│   ├─ Motivation: "单调栈在边界 case [3,1,2] 上可能越界..."   │
│   └─ Full reasoning (scrollable, max 8 lines)             │
│                                                               │
│ 💻 Engineer                                                 │
│   ├─ Code (syntax highlighted, diff-style if parent exists) │
│   ├─ Status: ✓ PASS  Runtime: 0.23s                         │
│   └─ stdout: [2,1] ✓ ✓ [3,4,5] ✓ ✓ ...                     │
│                                                               │
│ 📊 Analyzer                                                 │
│   ├─ Score: 69.1%  Δ -3.2%  (was 72.3%)                    │
│   └─ "得分下降 3.2%，因为漏判了空栈..."                      │
└───────────────────────────────────────────────────────────────┘
```

Color coding:
- Score ↑ (improvement): green border accent
- Score ↓ (decline): amber border accent
- Pruned node: red, italic, collapsed by default
- Current/running iteration: pulsing left-border indicator

### Component Architecture

```
components/reasoning/
  ReasoningFeed.tsx       — Container, subscribes to SSE
  IterationCard.tsx       — Single iteration accordion
  ReasoningStep.tsx       — Researcher / Engineer / Analyzer sub-panel
  CodeBlock.tsx           — Syntax-highlighted code (shiki, VS Code dark)
  EvalBadge.tsx           — PASS/FAIL + runtime chip
  PrunedNodeRow.tsx       — Pruned branch summary row
  ScoreDelta.tsx          — Score change indicator with arrow
  ProgressBar.tsx         — Top-level progress + score sparkline
```

### Keyboard / Interaction

- `Space` / click: toggle current iteration accordion
- `↑` / `↓`: navigate between iterations
- `[` / `]`: collapse / expand all
- Hover iteration card: shows mini score badge

---

## Layer 2: Reasoning Tree

### Data Source

Requires storing each node's parent ID. Current `PipelineEvent` already has `best_node_id` (parent). We need to extend it to:

```typescript
interface NodeSnapshot {
  id: number;
  parent_id: number | null;
  name: string;
  motivation: string;
  score: number;
  status: "alive" | "pruned" | "best";
  children: number[];  // resolved client-side from parent_id map
}
```

Node snapshots are accumulated from SSE events on the frontend — no backend storage required for Phase 1.

### UX Design

```
                    [root]
                    sort()
                   /      \
            [v1] 73.2%    [v2] 68.1%
           /    \            |
      [v1.1]    [v1.2]    [v2.1]
       ★best    ✗ pruned   70.3%
```

- Tree renders via `d3-hierarchy` + SVG (or `react Arborist` for simpler use)
- Click any node → opens IterationCard in L1 panel
- Alive nodes: solid border
- Pruned: dashed, greyed
- Best so far: gold star

---

## Layer 3: Score Journey

### UX Design

```
Score
 100% ──────────── ★───────────── best: 87.2%
  80% ──── ★ ───────────────────────────
  60% ────────── ✗ (pruned 3 branches)
      ────────────────────────────────────────
       I1    I2    I3    I4    I5    I6
```

- Built with `recharts` (already in Next.js ecosystem)
- Hover → tooltip with iteration details
- Annotation markers for: new best, pruned cluster, run complete

---

## Consequences

### Positive
- L1 is purely frontend — zero backend work beyond adding `event.type`
- All three layers are additive; can ship L1 independently
- Visualization becomes a **product differentiator** — no competitor shows the full loop

### Negative / Risks
- **Code block rendering**: shiki SSR requires Webpack custom config in Next.js; fallback to `highlight.js` if shiki setup is complex
- **Long iterations**: if `node_code_preview` is 500+ lines, need virtual scrolling in the feed
- **SSE reliability**: if the browser tab is backgrounded, EventSource may drop events; need periodic polling as fallback

### Mitigation
- Use `react-intersection-observer` to pause SSE subscription when tab is not visible
- Prettify code with `shiki` only in browser (not SSR) to avoid hydration issues

---

## Out of Scope (Phase 1)

- Voice-over / narration of reasoning steps
- Export reasoning as PDF
- Comparison between multiple runs
- LLM-generated plain-English summaries per iteration (would require another LLM call)
