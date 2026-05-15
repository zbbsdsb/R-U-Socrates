"use client";

export const dynamicParams = true;

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, StopCircle, CheckCircle2, XCircle, Loader2, Clock, Pause, Play } from "lucide-react";
import { getTask, cancelTask, pauseTask, resumeTask, type ApiTask } from "@/services/taskService";
import { useReasoningStore } from "@/stores/reasoningStore";
import { ReasoningFeed } from "@/components/reasoning/ReasoningFeed";
import { ReasoningTree } from "@/components/reasoning/ReasoningTree";
import { ScoreChart } from "@/components/reasoning/ScoreChart";
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
        currentProvider,
        currentModel,
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

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (runStatus === "running") {
          pauseTask(taskId).catch(() => {});
        } else if (runStatus === "paused") {
          resumeTask(taskId).catch(() => {});
        }
      } else if (e.code === "Escape") {
        e.preventDefault();
        cancelTask(taskId)
          .then(() => unsubscribe())
          .catch(() => {});
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [runStatus, taskId]);

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
            {runStatus === "paused" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                <Pause className="h-3.5 w-3.5" />
                Paused
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
            {!isRunning && runStatus !== "paused" && !isComplete && !isFailed && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {task.status}
              </span>
            )}

            {/* Meta labels */}
            <div className="text-right text-xs text-muted-foreground space-y-0.5">
              <div>Provider: <span className="font-medium text-foreground">{currentProvider || task.model.split("/")[0]}</span></div>
              <div>Model: <span className="font-medium text-foreground">{currentModel || task.model}</span></div>
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

          {/* Pause/Resume/Stop buttons */}
          {isRunning && (
            <>
              <Button
                variant="outline"
                className="w-full gap-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:border-yellow-900/40 dark:hover:bg-yellow-950/20"
                onClick={async () => {
                  try {
                    await pauseTask(taskId);
                  } catch {
                    // silently ignore
                  }
                }}
              >
                <Pause className="h-4 w-4" />
                Pause
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">Space</span>
                </kbd>
              </Button>
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
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">Esc</span>
                </kbd>
              </Button>
            </>
          )}
          {runStatus === "paused" && (
            <>
              <Button
                variant="outline"
                className="w-full gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/40 dark:hover:bg-green-950/20"
                onClick={async () => {
                  try {
                    await resumeTask(taskId);
                  } catch {
                    // silently ignore
                  }
                }}
              >
                <Play className="h-4 w-4" />
                Resume
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">Space</span>
                </kbd>
              </Button>
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
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">Esc</span>
                </kbd>
              </Button>
            </>
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

          {/* ── Score Journey Chart (L3) ── */}
          {(isComplete || isRunning) && <ScoreChart />}

          {/* ── Reasoning Tree (L2) ── */}
          {(isComplete || isRunning) && <ReasoningTree />}

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
