"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/stores/taskStore";
import { createTask, createRun } from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Task } from "@ru-socrates/types";

const STATUS_LABELS: Record<Task["status"], string> = {
  draft: "Draft",
  pending: "Pending",
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<Task["status"], string> = {
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
  const tasks = useTaskStore((s) => s.tasks);
  const activeRuns = useTaskStore((s) => s.activeRuns);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    templateId: "code-optimization",
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const task = await createTask({
        name: form.name,
        description: form.description,
        templateId: form.templateId,
      });
      await createRun(task.id);
      setForm({ name: "", description: "", templateId: "code-optimization" });
      setCreating(false);
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
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New Task"}
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New Task</CardTitle>
            <CardDescription>
              Describe what you want the research loop to explore.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  placeholder="e.g. Optimize merge sort for linked lists"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.templateId}
                  onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                >
                  <option value="code-optimization">Code Optimization</option>
                  <option value="architecture-design">Architecture Design</option>
                  <option value="algorithm-improvement">Algorithm Improvement</option>
                  <option value="bug-fixing">Bug Fixing</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Describe what you want to explore..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={!form.name.trim() || creating}
              >
                {creating ? "Creating..." : "Create & Start"}
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task list */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tasks yet. Create your first task above.
            </CardContent>
          </Card>
        )}
        {tasks.map((task) => {
          const taskRuns = Object.values(activeRuns).filter(
            (r) => r.taskId === task.id
          );
          const latestRun = taskRuns[taskRuns.length - 1];

          return (
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
                    className={`text-sm font-medium flex-shrink-0 ${STATUS_COLORS[task.status]}`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {task.config?.model && `Model: ${task.config.model}`}
                  {taskRuns.length > 0 && ` · ${taskRuns.length} run(s)`}
                </span>
                <span>
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
