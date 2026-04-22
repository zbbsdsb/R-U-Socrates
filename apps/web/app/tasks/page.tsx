"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { listTasks, createTask, type ApiTask, type TaskPayload } from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  pending: "text-yellow-600",
  queued: "text-blue-600",
  running: "text-blue-600",
  completed: "text-green-600",
  failed: "text-red-600",
  cancelled: "text-muted-foreground",
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<TaskPayload>({
    name: "",
    description: "",
    model: "gpt-4o-mini",
    max_iterations: 10,
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listTasks();
      // Sort: running first, then by created_at desc
      const sorted = [...data].sort((a, b) => {
        if (a.status === "running" && b.status !== "running") return -1;
        if (b.status === "running" && a.status !== "running") return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTasks(sorted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const task = await createTask(form);
      // Backend immediately starts a run; navigate to watch it
      router.push(`/tasks/${task.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Create, monitor, and review research tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTasks} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => setCreating((v) => !v)} disabled={loading}>
            {creating ? "Cancel" : "+ New Task"}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New Task</CardTitle>
            <CardDescription>
              Describe what you want the research loop to explore. The loop will run immediately after creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Name *</label>
                <Input
                  placeholder="e.g. Optimize merge sort for linked lists"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.model ?? "gpt-4o-mini"}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                >
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description * (min. 10 chars)</label>
                <Input
                  placeholder="What should the loop investigate? Be specific about the problem and evaluation criteria."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Iterations</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.max_iterations ?? 10}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_iterations: parseInt(e.target.value) || 10 }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={!form.name.trim() || creating}
              >
                {creating ? "Creating…" : "Create & Run"}
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {loadError && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="py-6">
            <p className="text-sm text-red-700 font-medium">Failed to load tasks</p>
            <p className="text-xs text-red-600 mt-1">{loadError}</p>
            <p className="text-xs text-red-500 mt-2">
              Make sure the API server is running at http://localhost:8000
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && !loadError && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Task list */}
      {!loading && !loadError && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tasks yet. Create your first task above.
              </CardContent>
            </Card>
          )}
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/tasks/${task.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{task.name}</CardTitle>
                    <CardDescription className="mt-1 truncate">
                      {task.description || "No description"}
                    </CardDescription>
                  </div>
                  <span
                    className={`text-sm font-medium flex-shrink-0 ${STATUS_COLORS[task.status] ?? ""}`}
                  >
                    {STATUS_LABELS[task.status] ?? task.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {task.model && `Model: ${task.model}`}
                  {task.max_iterations && task.max_iterations > 0 && ` · Max ${task.max_iterations} iterations`}
                </span>
                <span>
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
