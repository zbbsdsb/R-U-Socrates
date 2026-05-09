"use client";

export const dynamicParams = true;

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, StopCircle, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { getTask, cancelTask, type ApiTask } from "@/services/taskService";
import { useReasoningStore } from "@/stores/reasoningStore";
import { ReasoningFeed } from "@/components/reasoning/ReasoningFeed";
import { ScoreCard } from "@/components/ScoreCard";
import { RunErrorCard } from "@/components/RunErrorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id: taskId } = params;

  const [task, setTask] = useState<ApiTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    runStatus,
    bestScore,
    totalNodes,
    iterations,
    subscribe,
    unsubscribe,
    reset,
  } = useReasoningStore();

  const iterationCount = iterations.size;
  const prevBestScore = 0; // simplified — ScoreCard handles this

  // Fetch task details
  useEffect(() => {
    getTask(taskId)
      .then((t) => { setTask(t); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [taskId]);

  // Subscribe to SSE stream via reasoning store
  useEffect(() => {
    reset(); // clear any previous state
    subscribe(taskId);
    return () => unsubscribe();
  }, [taskId]);

  // Refresh task status when run completes
  useEffect(() => {
    if (runStatus === "completed") {
      getTask(taskId).then(setTask).catch(() => {});
    }
  }, [runStatus]);

  // ─── Render states ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
        Loading task…
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{error ?? "Task not found."}</p>
        <p className="text-xs text-muted-foreground">
          Make sure the API is running: uvicorn services.api.main:app --reload
        </p>
        <Link href="/tasks">
          <Button variant="outline">← Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const isRunning  = runStatus === "running";
  const isComplete = runStatus === "completed";
  const isFailed   = runStatus === "failed";

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Breadcrumb + header ───────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Link href="/tasks" className="hover:text-foreground transition-colors font-medium">
            Tasks
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[30ch] text-foreground">{task.name}</span>
        </nav>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
            <p className="text-muted-foreground mt-1 max-w-[60ch]">{task.description}</p>
          </div>

          {/* Meta + status badge */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {/* Status badge */}
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Running
              </span>
            )}
            {isComplete && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </span>
            )}
            {isFailed && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                <XCircle className="h-3.5 w-3.5" />
                Failed
              </span>
            )}
            {!isRunning && !isComplete && !isFailed && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {task.status}
              </span>
            )}

            {/* Meta labels */}
            <div className="text-right text-xs text-muted-foreground space-y-0.5">
              <div>Model: <span className="font-medium text-foreground">{task.model}</span></div>
              <div>Max iterations: <span className="font-medium text-foreground">{task.max_iterations}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

        {/* Left sidebar: ScoreCard (sticky) */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Score
              </div>
            </CardHeader>
            <CardContent>
              <ScoreCard
                currentScore={bestScore}
                iteration={totalNodes}
                prevBestScore={prevBestScore}
              />
            </CardContent>
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Iteration", value: iterationCount > 0 ? `${iterationCount} / ${task.max_iterations}` : "—" },
              { label: "Nodes", value: totalNodes > 0 ? totalNodes : "—" },
            ].map(({ label, value }) => (
              <Card key={label} className="bg-muted/30">
                <CardHeader className="pb-1">
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-semibold tabular-nums">{String(value)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stop run button */}
          {isRunning && (
            <Button
              variant="outline"
              className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-900/40 dark:hover:bg-orange-950/20"
              onClick={async () => {
                try {
                  await cancelTask(taskId);
                  unsubscribe();
                } catch {
                  // silently ignore
                }
              }}
            >
              <StopCircle className="h-4 w-4" />
              Stop Run
            </Button>
          )}
        </div>

        {/* Right: main content */}
        <div className="space-y-6">

          {/* Run failed */}
          {isFailed && (
            <RunErrorCard failedEvent={null} allEvents={[]} />
          )}

          {/* ── Reasoning Feed ── */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Reasoning Process
            </h2>
            <ReasoningFeed />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isComplete && (
              <Link href={`/results/${taskId}`}>
                <Button size="lg">View Results →</Button>
              </Link>
            )}
            {isFailed && (
              <Link href="/tasks">
                <Button variant="outline">← Back to Tasks</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
