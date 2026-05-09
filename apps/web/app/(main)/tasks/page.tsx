"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RefreshCw, Plus, X, Trash2, StopCircle, ClipboardList, Loader2, FileText,
} from "lucide-react";
import {
  listTasks, createTask, cancelTask, deleteTask,
  type ApiTask, type TaskPayload,
} from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/* ── Constants ─────────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  draft:     "Draft",
  pending:   "Pending",
  queued:    "Queued",
  running:   "Running",
  completed: "Completed",
  failed:    "Failed",
  cancelled: "Cancelled",
};

const STATUS_TEXT_COLOR: Record<string, string> = {
  draft:     "text-muted-foreground",
  pending:   "text-yellow-600 dark:text-yellow-400",
  queued:    "text-sky-600 dark:text-sky-400",
  running:   "text-blue-600 dark:text-blue-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  failed:    "text-red-600 dark:text-red-400",
  cancelled: "text-muted-foreground",
};

/** Left-edge status bar color */
const STATUS_BAR: Record<string, string> = {
  draft:     "border-l-border",
  pending:   "border-l-yellow-400",
  queued:    "border-l-sky-400",
  running:   "border-l-blue-500",
  completed: "border-l-emerald-500",
  failed:    "border-l-red-500",
  cancelled: "border-l-muted-foreground/30",
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

/* ── Template prefill ─────────────────────────────────────────────────── */

const TEMPLATE_PREFILL: Record<string, Partial<TaskPayload>> = {
  "code-optimization":   { description: "Find a faster or more memory-efficient implementation of the given algorithm." },
  "architecture-design": { description: "Explore alternative system designs for the given requirements and constraints." },
  "algorithm-improvement": { description: "Improve accuracy, convergence, or robustness of the given algorithm." },
  "bug-fixing":          { description: "Identify and fix the bug given the failing test case or error description." },
  "general":             { description: "Open-ended research exploration with no domain constraints." },
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

  const templateParam = searchParams.get("template") ?? "";

  const [form, setForm] = useState<TaskPayload>({
    name: "",
    description: TEMPLATE_PREFILL[templateParam]?.description ?? "",
    model: "gpt-4o-mini",
    max_iterations: 10,
  });

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
              <DialogTitle>Delete &ldquo;{deleteTarget.name}&rdquo;?</DialogTitle>
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
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting…</>
                ) : (
                  <><Trash2 className="h-3.5 w-3.5" />Delete Task</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Create, monitor, and review research tasks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTasks} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => setCreating((v) => !v)} disabled={loading} className="gap-1.5">
            {creating ? (
              <><X className="h-3.5 w-3.5" />Cancel</>
            ) : (
              <><Plus className="h-3.5 w-3.5" />New Task</>
            )}
          </Button>
        </div>
      </div>

      {/* Template banner */}
      {templateParam && TEMPLATE_PREFILL[templateParam] && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Using template:{" "}
            <strong className="text-foreground capitalize">
              {templateParam.replace(/-/g, " ")}
            </strong>
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
                  {templateParam
                    ? `New Task — ${templateParam.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}`
                    : "New Task"}
                </CardTitle>
                <CardDescription className="mt-1">
                  The research loop starts immediately after creation.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Cancel
              </Button>
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
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating…</>
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
                <div className="flex flex-col items-center gap-3">
                  <ClipboardList className="h-10 w-10 opacity-20" />
                  <p>No tasks yet. Click <strong>New Task</strong> above to start.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {tasks.map((task) => (
            <Card
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className={cn(
                "group relative overflow-hidden border-l-4 cursor-pointer transition-all duration-150",
                "hover:shadow-md hover:-translate-y-px",
                STATUS_BAR[task.status] ?? "border-l-border",
                task.status === "running" &&
                  "shadow-blue-500/10 shadow-sm",
              )}
            >
              {/* Running shimmer overlay */}
              {task.status === "running" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-[shimmer_2s_linear_infinite] -translate-x-full" />
                </div>
              )}

              <CardHeader className="pb-2 relative">
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
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                        </span>
                        Running
                      </span>
                    )}
                    <span className={cn("text-sm font-medium", STATUS_TEXT_COLOR[task.status] ?? "")}>
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.model && <span>{task.model}</span>}
                    {task.max_iterations && task.max_iterations > 0 && (
                      <span>{task.max_iterations} iters</span>
                    )}
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Action buttons */}
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
                        <StopCircle className="h-3 w-3" />
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
                        <Trash2 className="h-3 w-3" />
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
    <Suspense
      fallback={
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      }
    >
      <TasksPageInner />
    </Suspense>
  );
}
