"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listTasks, createTask, cancelTask, deleteTask, type ApiTask, type TaskPayload } from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

/* ── Constants ─────────────────────────────────────────────────────────── */

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
  pending: "text-yellow-600 dark:text-yellow-400",
  queued: "text-blue-600 dark:text-blue-400",
  running: "text-blue-600 dark:text-blue-400",
  completed: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  cancelled: "text-muted-foreground",
};

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini",                label: "GPT-4o mini" },
  { value: "gpt-4o",                     label: "GPT-4o" },
  { value: "o3-mini",                    label: "o3-mini" },
  { value: "deepseek-chat",              label: "DeepSeek-V3" },
  { value: "deepseek-reasoner",          label: "DeepSeek-R1" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { value: "qwen-plus",                  label: "Qwen Plus" },
  { value: "qwen-max",                   label: "Qwen Max" },
];

/* ── Template prefill map ─────────────────────────────────────────────── */

const TEMPLATE_PREFILL: Record<string, Partial<TaskPayload>> = {
  "code-optimization": {
    description: "Find a faster or more memory-efficient implementation of the given algorithm.",
  },
  "architecture-design": {
    description: "Explore alternative system designs for the given requirements and constraints.",
  },
  "algorithm-improvement": {
    description: "Improve accuracy, convergence, or robustness of the given algorithm.",
  },
  "bug-fixing": {
    description: "Identify and fix the bug given the failing test case or error description.",
  },
  "general": {
    description: "Open-ended research exploration with no domain constraints.",
  },
};

/* ── Inner page (reads searchParams) ──────────────────────────────────── */

function TasksPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Read template from URL query param
  const templateParam = searchParams.get("template") ?? "";

  const [form, setForm] = useState<TaskPayload>({
    name: "",
    description: TEMPLATE_PREFILL[templateParam]?.description ?? "",
    model: "gpt-4o-mini",
    max_iterations: 10,
  });

  // Re-fill description when template param changes
  useEffect(() => {
    if (templateParam && TEMPLATE_PREFILL[templateParam]) {
      setForm((f) => ({ ...f, ...TEMPLATE_PREFILL[templateParam] }));
    }
  }, [templateParam]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listTasks();
      const sorted = [...data].sort((a, b) => {
        if (a.status === "running" && b.status !== "running") return -1;
        if (b.status === "running" && a.status !== "running") return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTasks(sorted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
      toast({ type: "error", title: "Failed to load tasks", description: msg });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const task = await createTask(form);
      toast({ type: "success", title: "Task created", description: `"${task.name}" is now running.` });
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ type: "error", title: "Failed to create task", description: msg });
      setCreating(false);
    }
  }

  async function handleCancel(task: ApiTask) {
    try {
      await cancelTask(task.id);
      toast({ type: "success", title: "Task cancelled" });
      loadTasks();
    } catch {
      toast({ type: "error", title: "Failed to cancel task" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      toast({ type: "success", title: "Task deleted" });
      setDeleteTarget(null);
      loadTasks();
    } catch {
      toast({ type: "error", title: "Failed to delete task" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(v) => !v && setDeleteTarget(null)}
        >
          <DialogContent onClose={() => setDeleteTarget(null)}>
            <DialogHeader>
              <DialogTitle>Delete "{deleteTarget.name}"?</DialogTitle>
              <DialogDescription>
                This will permanently delete the task and all its run history. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-1.5"
              >
                {deleting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z"/>
                    </svg>
                    Delete Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Create, monitor, and review research tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTasks} disabled={loading} className="gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
            Refresh
          </Button>
          <Button onClick={() => setCreating((v) => !v)} disabled={loading} className="gap-1.5">
            {creating ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14m-7-7h14"/>
                </svg>
                New Task
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Template banner */}
      {templateParam && TEMPLATE_PREFILL[templateParam] && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <svg className="h-4 w-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
          </svg>
          <span className="text-muted-foreground">
            Using template: <strong className="text-foreground capitalize">{templateParam.replace(/-/g, " ")}</strong>
          </span>
          <button
            onClick={() => router.push("/tasks")}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {templateParam ? `New Task — ${templateParam.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}` : "New Task"}
                </CardTitle>
                <CardDescription className="mt-1">
                  The research loop starts immediately after creation.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
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
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Select
                  value={form.model}
                  onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}
                  options={MODEL_OPTIONS}
                  placeholder="Select model…"
                  aria-label="Select LLM model"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Description *</label>
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
                disabled={!form.name.trim() || !form.description.trim() || creating}
                className="gap-1.5"
              >
                {creating ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating…
                  </>
                ) : "Create & Run"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {loadError && (
        <Card className="border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="py-6">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">Failed to load tasks</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">{loadError}</p>
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
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-8 w-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                  </svg>
                  <p>No tasks yet. Click <strong>New Task</strong> above to start.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="group hover:border-primary/30 transition-all duration-150 cursor-pointer"
              onClick={() => router.push(`/tasks/${task.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{task.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-1">
                      {task.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === "running" && (
                      <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Running
                      </span>
                    )}
                    <span className={`text-sm font-medium ${STATUS_COLORS[task.status] ?? ""}`}>
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.model && <span>{task.model}</span>}
                    {task.max_iterations && task.max_iterations > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                        {task.max_iterations} iters
                      </span>
                    )}
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                  {/* Action buttons — stop propagation */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.status === "running" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleCancel(task)}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="1"/>
                        </svg>
                        Stop
                      </Button>
                    )}
                    {(task.status === "completed" || task.status === "failed" || task.status === "cancelled") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteTarget(task)}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z"/>
                        </svg>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Wrap with Suspense (useSearchParams) ──────────────────────────────── */

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>}>
      <TasksPageInner />
    </Suspense>
  );
}
