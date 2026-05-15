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
  status: "running" | "paused" | "completed" | "failed";
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

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useTaskStore = create<TaskStore>((set, get) => {
  // Track debounced state per task
  const taskState: Record<string, {
    timeout: NodeJS.Timeout | null;
    pendingEvents: PipelineEvent[];
  }> = {};

  // Function to flush pending events for a task
  const flushEvents = (taskId: string) => {
    const state = taskState[taskId];
    if (!state || state.pendingEvents.length === 0) return;

    set((prevState) => {
      const prev = prevState.runProgress[taskId];
      if (!prev) return prevState;

      // Merge all pending events
      let updated = { ...prev };
      for (const event of state.pendingEvents) {
        let status: RunProgress["status"] = updated.status;
        if (event.type === "run_complete") {
          status = "completed";
        } else if (event.type === "run_failed") {
          status = "failed";
        } else if (event.type === "run_paused") {
          status = "paused";
        } else if (event.type === "run_resumed") {
          status = "running";
        } else if (updated.status !== "paused") {
          status = "running";
        }

        updated = {
          ...updated,
          status,
          currentStage: eventToStage(event.type),
          iteration: event.iteration > 0 ? event.iteration : updated.iteration,
          bestScore: event.best_score > updated.bestScore ? event.best_score : updated.bestScore,
          totalNodes: event.total_nodes > 0 ? event.total_nodes : updated.totalNodes,
          lastMessage: event.message || updated.lastMessage,
          lastEvent: event,
          events: [...updated.events, event],
        };
      }

      return {
        runProgress: { ...prevState.runProgress, [taskId]: updated },
      };
    });

    state.pendingEvents = [];
  };

  return {
    selectedTaskId: null,
    runProgress: {},

    setSelectedTask: (id) => set({ selectedTaskId: id }),

    initRunProgress: (taskId, runId) => {
      // Clear any existing debounce for this task
      if (taskState[taskId] && taskState[taskId].timeout) {
        clearTimeout(taskState[taskId].timeout);
      }
      taskState[taskId] = { timeout: null, pendingEvents: [] };

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
      }));
    },

    applyPipelineEvent: (taskId, event) => {
      // Initialize task state if needed
      if (!taskState[taskId]) {
        taskState[taskId] = { timeout: null, pendingEvents: [] };
      }

      // Add event to pending list
      taskState[taskId].pendingEvents.push(event);

      // For completion/failure/pause/resume events, flush immediately
      if (["run_complete", "run_failed", "run_paused", "run_resumed"].includes(event.type)) {
        if (taskState[taskId].timeout) {
          clearTimeout(taskState[taskId].timeout);
          taskState[taskId].timeout = null;
        }
        flushEvents(taskId);
        return;
      }

      // Otherwise, debounce
      if (taskState[taskId].timeout) {
        clearTimeout(taskState[taskId].timeout);
      }
      taskState[taskId].timeout = setTimeout(() => {
        flushEvents(taskId);
        taskState[taskId].timeout = null;
      }, 100);
    },

    getRunProgress: (taskId) => get().runProgress[taskId] ?? null,
  };
});
