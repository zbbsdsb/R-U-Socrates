"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTask, cancelTask, type ApiTask } from "@/services/taskService";
import { useReasoningStore } from "@/stores/reasoningStore";
import { ReasoningFeed } from "@/components/reasoning/ReasoningFeed";
import { ScoreCard } from "@/components/ScoreCard";
import { RunErrorCard } from "@/components/RunErrorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  const lastEvalEvent = useReasoningStore((s) => {
    const iters = Array.from(s.iterations.values());
    const last = iters[iters.length - 1];
    return last?.engineer.status === "complete" ? last.engineer : null;
  });
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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">Tasks</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{task.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
          <p className="text-muted-foreground mt-1 max-w-[60ch]">{task.description}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground shrink-0 space-y-0.5">
          <div>Model: <span className="font-medium text-foreground">{task.model}</span></div>
          <div>Max iterations: <span className="font-medium text-foreground">{task.max_iterations}</span></div>
          {isRunning && (
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-600">Running</span>
            </div>
          )}
          {isComplete && <div className="text-green-600 font-medium">Completed</div>}
          {isFailed && <div className="text-red-600 font-medium">Failed</div>}
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
                lastEvalEvent={lastEvalEvent ?? undefined}
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
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={async () => {
                try {
                  await cancelTask(taskId);
                  unsubscribe();
                } catch {
                  // silently ignore
                }
              }}
            >
              ⏹ Stop Run
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
