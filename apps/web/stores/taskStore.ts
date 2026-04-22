/**
 * taskStore — Zustand store for UI state only.
 *
 * This store holds UI state (selected task, active run progress).
 * It does NOT hold mock data — all data comes from the real API via taskService.
 *
 * SSE events from the pipeline are merged here as they arrive,
 * driving real-time UI updates.
 */

import { create } from "zustand";
import type { PipelineEvent } from "@/services/taskService";

// ─── Run progress state (derived from SSE events) ─────────────────────────────

export interface RunProgress {
  runId: string;
  taskId: string;
  status: "running" | "completed" | "failed";
  currentStage: "idle" | "researcher" | "engineer" | "analyzer";
  iteration: number;
  bestScore: number;
  totalNodes: number;
  lastMessage: string;
  lastEvent: PipelineEvent | null;
  events: PipelineEvent[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface TaskStore {
  selectedTaskId: string | null;
  runProgress: Record<string, RunProgress>; // keyed by taskId

  // Actions
  setSelectedTask: (id: string | null) => void;
  initRunProgress: (taskId: string, runId: string) => void;
  applyPipelineEvent: (taskId: string, event: PipelineEvent) => void;
  getRunProgress: (taskId: string) => RunProgress | null;
}

function eventToStage(eventType: string): RunProgress["currentStage"] {
  if (eventType.startsWith("researcher")) return "researcher";
  if (eventType.startsWith("engineer")) return "engineer";
  if (eventType.startsWith("analyzer")) return "analyzer";
  return "idle";
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  selectedTaskId: null,
  runProgress: {},

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  initRunProgress: (taskId, runId) =>
    set((state) => ({
      runProgress: {
        ...state.runProgress,
        [taskId]: {
          runId,
          taskId,
          status: "running",
          currentStage: "idle",
          iteration: 0,
          bestScore: 0,
          totalNodes: 0,
          lastMessage: "Starting research loop…",
          lastEvent: null,
          events: [],
        },
      },
    })),

  applyPipelineEvent: (taskId, event) =>
    set((state) => {
      const prev = state.runProgress[taskId];
      if (!prev) return state;

      const status: RunProgress["status"] =
        event.type === "run_complete"
          ? "completed"
          : event.type === "run_failed"
          ? "failed"
          : "running";

      const updated: RunProgress = {
        ...prev,
        status,
        currentStage: eventToStage(event.type),
        iteration: event.iteration > 0 ? event.iteration : prev.iteration,
        bestScore: event.best_score > prev.bestScore ? event.best_score : prev.bestScore,
        totalNodes: event.total_nodes > 0 ? event.total_nodes : prev.totalNodes,
        lastMessage: event.message || prev.lastMessage,
        lastEvent: event,
        events: [...prev.events, event],
      };

      return {
        runProgress: { ...state.runProgress, [taskId]: updated },
      };
    }),

  getRunProgress: (taskId) => get().runProgress[taskId] ?? null,
}));
