/**
 * taskService — Real API client for R U Socrates backend.
 *
 * All calls go to FastAPI. The base URL is read dynamically from
 * settingsStore on every request, so changes in Settings take effect
 * immediately without a page reload.
 *
 * SSE streaming: subscribeToRun() opens an EventSource to
 * GET /api/tasks/{taskId}/stream and forwards PipelineEvents to the handler.
 */

import { getApiBase } from "@/stores/settingsStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskPayload {
  name: string;
  description: string;
  model?: string;
  max_iterations?: number;
}

export interface ApiTask {
  id: string;
  name: string;
  description: string;
  status: string;
  model: string;
  max_iterations: number;
  created_at: string;
  updated_at: string;
}

export interface ApiRun {
  id: string;
  task_id: string;
  status: string;
  best_score: number;
  total_nodes: number;
  total_iterations: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface ApiResult {
  id: string;
  run_id: string;
  best_score: number;
  best_node: {
    name: string;
    motivation: string;
    code: string;
    analysis: string;
  };
  stats: Record<string, unknown>;
  created_at: string;
}

/** Mirrors PipelineEvent.to_sse_dict() from services/worker/models.py */
export interface PipelineEvent {
  type: string;
  run_id: string;
  iteration: number;
  timestamp: string;
  message: string;
  agent_type: string;   // "researcher" | "engineer" | "analyzer" | "" (ADR-007)
  node_name: string;
  node_motivation: string;
  node_code_preview: string;
  eval_score: number;
  eval_success: boolean;
  eval_runtime: number;
  eval_stdout_preview: string;
  analysis: string;
  best_score: number;
  best_node_id: number | null;
  total_nodes: number;
  best_node: Record<string, unknown> | null;
  stats: Record<string, unknown> | null;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function listTasks(): Promise<ApiTask[]> {
  return apiFetch<ApiTask[]>("/api/tasks");
}

export async function getTask(id: string): Promise<ApiTask> {
  return apiFetch<ApiTask>(`/api/tasks/${id}`);
}

/**
 * Create a task. The backend immediately starts a run and returns
 * the task with status="running". Connect to /stream to watch progress.
 */
export async function createTask(payload: TaskPayload): Promise<ApiTask> {
  return apiFetch<ApiTask>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      model: payload.model ?? "qwen-plus",   // matches backend schema default
      max_iterations: payload.max_iterations ?? 10,
    }),
  });
}

export async function listRuns(taskId: string): Promise<ApiRun[]> {
  return apiFetch<ApiRun[]>(`/api/tasks/${taskId}/runs`);
}

export async function cancelTask(taskId: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${taskId}/cancel`, { method: "POST" });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
}

// ─── Results ─────────────────────────────────────────────────────────────────

export async function getResult(taskId: string): Promise<ApiResult> {
  return apiFetch<ApiResult>(`/api/results/${taskId}`);
}

export async function getResultMarkdown(taskId: string): Promise<string> {
  const res = await fetch(`${getApiBase()}/api/results/${taskId}/export`);
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.text();
}

// ─── SSE: real-time pipeline events ───────────────────────────────────────────

export type PipelineEventHandler = (event: PipelineEvent) => void;

/**
 * Subscribe to live pipeline events for a task.
 *
 * Opens an EventSource to GET /api/tasks/{taskId}/stream.
 * Calls handler for every PipelineEvent received.
 * Returns an unsubscribe function.
 *
 * This is the transparency mechanism: the frontend sees every step of
 * Researcher → Engineer → Analyzer as it happens.
 */
export function subscribeToRun(
  taskId: string,
  handler: PipelineEventHandler
): () => void {
  const url = `${getApiBase()}/api/tasks/${taskId}/stream`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as PipelineEvent;
      handler(event);
      // Auto-close after terminal events
      if (event.type === "run_complete" || event.type === "run_failed") {
        es.close();
      }
    } catch {
      // Malformed event — ignore
    }
  };

  es.onerror = () => {
    es.close();
  };

  return () => es.close();
}
