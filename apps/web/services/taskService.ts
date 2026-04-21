/**
 * taskService — API client for task/runs/results.
 * Currently backed by mock data (Zustand store).
 * Replace the implementation with real API calls once services/api is ready.
 */
import type {
  Task,
  CreateTaskPayload,
  Run,
  Result,
} from "@ru-socrates/types";
import { useTaskStore } from "@/stores/taskStore";

// ─── Mock delay ───────────────────────────────────────────────────────────────

const delay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Demo progress sequence ────────────────────────────────────────────────────

const DEMO_STEPS: Run["step"][] = ["researcher", "engineer", "analyzer"];

function buildDemoProgress(runId: string): Array<{
  step: Run["step"];
  progress: number;
  iteration: number;
  bestScore: number;
  message: string;
}> {
  const steps: Array<{
    step: Run["step"];
    progress: number;
    iteration: number;
    bestScore: number;
    message: string;
  }> = [];

  const scores = [0.12, 0.18, 0.31, 0.31, 0.45, 0.52, 0.52, 0.52, 0.52, 0.52, 0.67, 0.67, 0.71, 0.71, 0.79, 0.79];
  const messages = [
    "Sampling 8 related nodes from memory...",
    "Querying Cognition store for relevant papers...",
    "Generating candidate code hypothesis #1...",
    "Synthesizing motivation from experiment history...",
    "Code candidate received. Executing in sandbox...",
    "Running evaluator... score: 0.52",
    "Storing node #1 in database...",
    "Comparing against best score 0.52...",
    "Converging toward optimal strategy...",
    "Sampling 8 related nodes from memory...",
    "Running evaluator... score: 0.67",
    "Storing node #2 in database...",
    "New best score! Updating best snapshot...",
    "Sampling 8 related nodes from memory...",
    "Running evaluator... score: 0.79",
    "Max iterations reached. Shutting down research loop.",
  ];
  const progressPcts = [10, 35, 65, 80, 10, 40, 80, 20, 60, 20, 40, 80, 80, 80, 80, 100];

  for (let i = 0; i < scores.length; i++) {
    const cycleIndex = Math.floor(i / 3);
    const stepIdx = i % 3;
    steps.push({
      step: DEMO_STEPS[stepIdx],
      progress: progressPcts[i],
      iteration: cycleIndex + 1,
      bestScore: scores[i],
      message: messages[i],
    });
  }

  return steps;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function listTasks(): Promise<Task[]> {
  await delay();
  return useTaskStore.getState().tasks;
}

export async function getTask(id: string): Promise<Task | null> {
  await delay();
  return useTaskStore.getState().tasks.find((t) => t.id === id) ?? null;
}

export async function createTask(
  payload: CreateTaskPayload
): Promise<Task> {
  await delay(600);
  const store = useTaskStore.getState();
  const newTask: Task = {
    id: `task-${Date.now()}`,
    name: payload.name,
    description: payload.description,
    templateId: payload.templateId,
    status: "pending",
    config: { model: payload.config?.model },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.tasks.push(newTask);
  return newTask;
}

export async function cancelTask(id: string): Promise<void> {
  await delay();
  const store = useTaskStore.getState();
  const task = store.tasks.find((t) => t.id === id);
  if (task) task.status = "cancelled";
}

// ─── Runs ───────────────────────────────────────────────────────────────────

export async function listRuns(taskId: string): Promise<Run[]> {
  await delay();
  return useTaskStore.getState().getRunsForTask(taskId);
}

export async function createRun(taskId: string): Promise<Run> {
  await delay(600);
  const store = useTaskStore.getState();
  const task = store.tasks.find((t) => t.id === taskId);
  if (task) task.status = "queued";
  const newRun: Run = {
    id: `run-${Date.now()}`,
    taskId,
    status: "pending",
    step: "idle",
    progress: 0,
    bestScore: 0,
    iteration: 0,
    createdAt: new Date().toISOString(),
  };
  store.activeRuns[newRun.id] = newRun;
  if (task) task.status = "running";
  return newRun;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export async function getResult(taskId: string): Promise<Result | null> {
  await delay();
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  if (!task || task.status !== "completed") return null;
  return {
    runId: `run-${taskId}`,
    taskId,
    status: "completed",
    bestNode: {
      nodeId: 3,
      name: "Optimized Quicksort (median-of-three pivot)",
      code: `def quicksort(arr):
    \"\"\"In-place quicksort with median-of-three pivot selection.\"\"\"
    def _partition(low, high):
        mid = (low + high) // 2
        # Median-of-three: sort low, mid, high
        if arr[low] > arr[mid]:
            arr[low], arr[mid] = arr[mid], arr[low]
        if arr[mid] > arr[high]:
            arr[mid], arr[high] = arr[high], arr[mid]
        if arr[low] > arr[mid]:
            arr[low], arr[mid] = arr[mid], arr[low]
        # Move pivot to high-1
        arr[mid], arr[high - 1] = arr[high - 1], arr[mid]
        pivot = arr[high - 1]
        i, j = low, high - 1
        while True:
            while arr[i + 1] < pivot: i += 1
            while j > low and arr[j - 1] > pivot: j -= 1
            if i >= j: break
            arr[i + 1], arr[j - 1] = arr[j - 1], arr[i + 1]
        arr[i + 1], arr[high - 1] = arr[high - 1], arr[i + 1]
        return i + 1

    def _quicksort(low, high):
        if high - low < 10:
            # Insertion sort for small subarrays
            for i in range(low + 1, high + 1):
                key = arr[i]
                j = i - 1
                while j >= low and arr[j] > key:
                    arr[j + 1] = arr[j]
                    j -= 1
                arr[j + 1] = key
            return
        pivot_index = _partition(low, high)
        _quicksort(low, pivot_index - 1)
        _quicksort(pivot_index + 1, high)

    _quicksort(0, len(arr) - 1)
    return arr`,
      score: 0.79,
      motivation:
        "Median-of-three pivot reduces O(n²) worst-case probability; insertion sort fallback for small subarrays reduces overhead.",
      analysis:
        "The median-of-three strategy reduces the chance of O(n²) degradation on sorted input by ~60%. Insertion sort fallback for subarrays < 10 elements cuts function call overhead significantly. This combination consistently outperforms naive quicksort on partially sorted data.",
      results: { timeComplexity: "O(n log n)", spaceComplexity: "O(log n)", avgComparisons: 142 },
    },
    allNodes: [],
    summary:
      "The system explored 3 candidate implementations and converged on a median-of-three pivot strategy with an insertion-sort fallback for small subarrays. After 16 model calls and 3 research iterations, the best solution achieved 79% on the evaluation benchmark — 27 percentage points above the baseline.",
    metrics: {
      totalNodes: 3,
      totalIterations: 3,
      bestScore: 0.79,
      durationSeconds: 47,
      modelCalls: 16,
    },
    exportedAt: new Date().toISOString(),
  };
}

// ─── SSE subscription ─────────────────────────────────────────────────────────

export type ProgressHandler = (event: {
  runId: string;
  step: Run["step"];
  progress: number;
  iteration: number;
  bestScore: number;
  message?: string;
}) => void;

const ACTIVE_SUBSCRIPTIONS = new Map<string, ReturnType<typeof setTimeout>>();

export function subscribeToRun(runId: string, handler: ProgressHandler): () => void {
  const store = useTaskStore.getState();
  const task = Object.values(store.tasks).find((t) => t.id === store.getRunsForTask(t.id)?.[0]?.taskId);
  const steps = buildDemoProgress(runId);
  let index = 0;

  function tick() {
    if (index >= steps.length) {
      // Mark run as completed
      store.updateRunProgress(runId, {
        status: "completed",
        step: "idle",
        progress: 100,
      });
      const runTask = Object.values(store.tasks).find((t) =>
        Object.values(store.activeRuns).find((r) => r.id === runId)?.taskId === t.id
      );
      if (runTask) runTask.status = "completed";
      ACTIVE_SUBSCRIPTIONS.delete(runId);
      return;
    }

    const step = steps[index];
    handler({
      runId,
      step: step.step,
      progress: step.progress,
      iteration: step.iteration,
      bestScore: step.bestScore,
      message: step.message,
    });

    // Also update the task status
    const currentTask = Object.values(store.tasks).find((t) =>
      Object.values(store.activeRuns).find((r) => r.id === runId)?.taskId === t.id
    );
    if (currentTask && step.step === "analyzer" && index === steps.length - 1) {
      currentTask.status = "completed";
    }

    index++;
    const nextDelay = 600 + Math.random() * 600; // 600–1200ms between steps
    const timer = setTimeout(tick, nextDelay);
    ACTIVE_SUBSCRIPTIONS.set(runId, timer);
  }

  // Kick off after a short initial delay
  const timer = setTimeout(tick, 400);
  ACTIVE_SUBSCRIPTIONS.set(runId, timer);

  return () => {
    const existing = ACTIVE_SUBSCRIPTIONS.get(runId);
    if (existing) clearTimeout(existing);
    ACTIVE_SUBSCRIPTIONS.delete(runId);
  };
}
