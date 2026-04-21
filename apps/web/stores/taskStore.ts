import { create } from "zustand";
import type { Task, Run } from "@ru-socrates/types";

// ─── Mock seed data ────────────────────────────────────────────────────────────

const MOCK_TASKS: Task[] = [
  {
    id: "task-001",
    name: "Sort Algorithm Optimization",
    description: "Optimize quicksort for partially sorted arrays",
    templateId: "code-optimization",
    status: "completed",
    config: { model: "gpt-4o", maxNodes: 20 },
    createdAt: "2026-04-20T10:00:00Z",
    updatedAt: "2026-04-20T10:35:00Z",
  },
  {
    id: "task-002",
    name: "Cache Invalidation Strategy",
    description: "Design a cache invalidation strategy for a write-heavy workload",
    templateId: "architecture-design",
    status: "running",
    config: { model: "deepseek-chat", maxNodes: 15 },
    createdAt: "2026-04-21T08:00:00Z",
    updatedAt: "2026-04-21T08:22:00Z",
  },
  {
    id: "task-003",
    name: "Binary Search Bug Fix",
    description: "Fix off-by-one error in boundary condition handling",
    templateId: "bug-fixing",
    status: "failed",
    config: { model: "gpt-4o", maxNodes: 5 },
    createdAt: "2026-04-19T14:00:00Z",
    updatedAt: "2026-04-19T14:10:00Z",
  },
];

const MOCK_RUNS: Record<string, Run[]> = {
  "task-001": [
    {
      id: "run-001",
      taskId: "task-001",
      status: "completed",
      step: "idle",
      progress: 100,
      bestScore: 0.94,
      bestNodeId: "node-007",
      iteration: 12,
      startedAt: "2026-04-20T10:00:00Z",
      completedAt: "2026-04-20T10:35:00Z",
      createdAt: "2026-04-20T10:00:00Z",
    },
  ],
  "task-002": [
    {
      id: "run-002",
      taskId: "task-002",
      status: "running",
      step: "engineer",
      progress: 60,
      bestScore: 0.71,
      bestNodeId: "node-003",
      iteration: 4,
      startedAt: "2026-04-21T08:00:00Z",
      createdAt: "2026-04-21T08:00:00Z",
    },
  ],
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  activeRuns: Record<string, Run>;

  // Actions
  setSelectedTask: (id: string | null) => void;
  getSelectedTask: () => Task | null;
  getRunsForTask: (taskId: string) => Run[];
  updateRunProgress: (runId: string, run: Partial<Run>) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: MOCK_TASKS,
  selectedTaskId: null,
  activeRuns: Object.fromEntries(
    Object.entries(MOCK_RUNS).flatMap(([, runs]) =>
      runs.map((r) => [r.id, r])
    )
  ),

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  getSelectedTask: () => {
    const { tasks, selectedTaskId } = get();
    return tasks.find((t) => t.id === selectedTaskId) ?? null;
  },

  getRunsForTask: (taskId) => {
    const { activeRuns } = get();
    return Object.values(activeRuns).filter((r) => r.taskId === taskId);
  },

  updateRunProgress: (runId, update) =>
    set((state) => ({
      activeRuns: {
        ...state.activeRuns,
        [runId]: { ...state.activeRuns[runId], ...update },
      },
    })),
}));
