"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTasks, type ApiTask } from "@/services/taskService";

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-600",
  running: "text-blue-600",
  failed: "text-red-600",
  pending: "text-yellow-600",
  queued: "text-blue-600",
  draft: "text-muted-foreground",
  cancelled: "text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  running: "Running",
  failed: "Failed",
  pending: "Pending",
  queued: "Queued",
  draft: "Draft",
  cancelled: "Cancelled",
};

export default function HomePage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    running: tasks.filter((t) => t.status === "running").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="flex items-start gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="R U Socrates"
          className="mt-1 h-14 w-14 rounded-xl object-contain shrink-0"
        />
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Ask a question.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            R U Socrates runs autonomous research loops to find answers — then
            explains them in plain language so you can judge the evidence
            yourself.
          </p>
          <div className="flex gap-3 pt-1">
            <Link href="/tasks">
              <Button size="lg">New Task</Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tasks", value: stats.total },
          { label: "Completed", value: stats.completed },
          { label: "Running", value: stats.running },
          { label: "Failed", value: stats.failed },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "—" : value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* API error */}
      {loadError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4 text-sm text-orange-700 flex items-center justify-between gap-4">
            <span>
              <strong>API offline</strong> — stats and recent tasks unavailable.
              Make sure the backend is running.
            </span>
            <Link
              href="/settings"
              className="shrink-0 text-orange-800 underline underline-offset-2 hover:text-orange-900 font-medium"
            >
              Go to Settings →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Tasks</h2>
          <Link href="/tasks">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tasks yet — go create your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-sm font-medium flex-shrink-0 ${STATUS_COLORS[task.status] ?? ""}`}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                      <span className="text-sm truncate">{task.name}</span>
                      {task.model && (
                        <span className="text-xs text-muted-foreground font-mono flex-shrink-0 hidden sm:inline">
                          {task.model}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {new Date(task.created_at).toLocaleDateString()} →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
