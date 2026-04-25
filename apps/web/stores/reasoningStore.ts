/**
 * reasoningStore — Zustand store for the Reasoning Visualization (L1 Live Feed).
 *
 * Normalises raw PipelineEvents from SSE into structured IterationData,
 * grouped by iteration number. Consumed by ReasoningFeed and its sub-components.
 */

import { create } from "zustand";
import { subscribeToRun, type PipelineEvent } from "@/services/taskService";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StageStatus = "idle" | "active" | "complete" | "failed";

export interface StageData {
  status: StageStatus;
  // Researcher
  nodeName?: string;
  nodeMotivation?: string;
  nodeCodePreview?: string;
  // Engineer
  evalScore?: number;
  evalSuccess?: boolean;
  evalRuntime?: number;
  evalStdoutPreview?: string;
  // Analyzer
  analysis?: string;
}

export interface IterationData {
  iteration: number;
  researcher: StageData;
  engineer: StageData;
  analyzer: StageData;
  bestScore: number;
  totalNodes: number;
}

export interface ReasoningState {
  // Grouped by iteration
  iterations: Map<number, IterationData>;
  // Overall run status
  runStatus: "idle" | "running" | "completed" | "failed";
  // Which iteration is currently active (being streamed)
  activeIteration: number;
  // Best score ever achieved
  bestScore: number;
  // Total nodes explored
  totalNodes: number;

  // Internal
  _unsub: (() => void) | null;
}

export interface ReasoningActions {
  /** Start subscribing to a run's SSE stream. Auto-cleanups previous subscription. */
  subscribe: (taskId: string) => void;
  /** Stop the SSE subscription. */
  unsubscribe: () => void;
  /** Reset all state (e.g. before starting a new run). */
  reset: () => void;
  /** Get ordered iteration list for rendering. */
  getIterations: () => IterationData[];
}

type ReasoningStore = ReasoningState & ReasoningActions;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyStage(): StageData {
  return { status: "idle" };
}

function getOrCreate(
  map: Map<number, IterationData>,
  iter: number
): IterationData {
  if (!map.has(iter)) {
    map.set(iter, {
      iteration: iter,
      researcher: emptyStage(),
      engineer: emptyStage(),
      analyzer: emptyStage(),
      bestScore: 0,
      totalNodes: 0,
    });
  }
  return map.get(iter)!;
}

function applyEvent(
  iterations: Map<number, IterationData>,
  event: PipelineEvent
): Map<number, IterationData> {
  const iter = event.iteration > 0 ? event.iteration : 1;
  const data = getOrCreate(iterations, iter);

  switch (event.type) {
    // ── Researcher ──────────────────────────────────────────────────────────
    case "researcher_started":
      data.researcher = { status: "active" };
      break;
    case "researcher_complete":
      data.researcher = {
        status: "complete",
        nodeName: event.node_name,
        nodeMotivation: event.node_motivation,
        nodeCodePreview: event.node_code_preview,
      };
      break;
    case "researcher_failed":
      data.researcher = { status: "failed" };
      break;

    // ── Engineer ────────────────────────────────────────────────────────────
    case "engineer_started":
      data.engineer = { status: "active" };
      break;
    case "engineer_complete":
      data.engineer = {
        status: "complete",
        evalScore: event.eval_score,
        evalSuccess: event.eval_success,
        evalRuntime: event.eval_runtime,
        evalStdoutPreview: event.eval_stdout_preview,
      };
      break;
    case "engineer_failed":
      data.engineer = { status: "failed" };
      break;

    // ── Analyzer ─────────────────────────────────────────────────────────────
    case "analyzer_started":
      data.analyzer = { status: "active" };
      break;
    case "analyzer_complete":
      data.analyzer = { status: "complete", analysis: event.analysis };
      break;
    case "analyzer_failed":
      data.analyzer = { status: "failed" };
      break;

    // ── Iteration ────────────────────────────────────────────────────────────
    case "iteration_complete":
      data.bestScore = event.best_score;
      data.totalNodes = event.total_nodes;
      break;

    // ── Run ─────────────────────────────────────────────────────────────────
    case "run_complete":
    case "run_failed":
      break; // handled via runStatus in store
  }

  return iterations;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useReasoningStore = create<ReasoningStore>((set, get) => ({
  iterations: new Map(),
  runStatus: "idle",
  activeIteration: 0,
  bestScore: 0,
  totalNodes: 0,
  _unsub: null,

  subscribe: (taskId: string) => {
    get().unsubscribe();

    const unsub = subscribeToRun(taskId, (event: PipelineEvent) => {
      set((state) => {
        // Run lifecycle
        if (event.type === "run_started") {
          return {
            iterations: new Map(),
            runStatus: "running",
            activeIteration: 0,
            bestScore: 0,
            totalNodes: 0,
          };
        }
        if (event.type === "run_complete") {
          return {
            ...state,
            runStatus: "completed",
            bestScore: event.best_score,
            iterations: applyEvent(state.iterations, event),
          };
        }
        if (event.type === "run_failed") {
          return { ...state, runStatus: "failed" };
        }

        // Active iteration tracking
        const activeIteration =
          event.iteration > 0 ? event.iteration : state.activeIteration;

        // Best score
        const bestScore = event.best_score > state.bestScore
          ? event.best_score
          : state.bestScore;

        // Total nodes
        const totalNodes = event.total_nodes || state.totalNodes;

        // Apply event to iteration map (immutable via Map spread)
        const next = applyEvent(new Map(state.iterations), event);

        return {
          iterations: next,
          activeIteration,
          bestScore,
          totalNodes,
        };
      });
    });

    set({ _unsub: unsub, runStatus: "running" });
  },

  unsubscribe: () => {
    const { _unsub } = get();
    if (_unsub) {
      _unsub();
      set({ _unsub: null });
    }
  },

  reset: () => {
    get().unsubscribe();
    set({
      iterations: new Map(),
      runStatus: "idle",
      activeIteration: 0,
      bestScore: 0,
      totalNodes: 0,
    });
  },

  getIterations: () => {
    const { iterations } = get();
    return Array.from(iterations.values()).sort(
      (a, b) => a.iteration - b.iteration
    );
  },
}));
