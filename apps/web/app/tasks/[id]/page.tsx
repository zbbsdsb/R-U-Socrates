"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { subscribeToRun, type ProgressHandler } from "@/services/taskService";
import { useTaskStore } from "@/stores/taskStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Run } from "@ru-socrates/types";

// ─── Stage config ─────────────────────────────────────────────────────────────

const STEPS: Array<{
  id: Run["step"];
  label: string;
  description: string;
}> = [
  { id: "researcher", label: "Researcher", description: "Sampling memories and generating hypotheses" },
  { id: "engineer", label: "Engineer", description: "Writing and executing candidate code" },
  { id: "analyzer", label: "Analyzer", description: "Analyzing results and deciding next move" },
];

// ─── Mock run data for demo ───────────────────────────────────────────────────

const DEMO_PROGRESS: Array<{
  step: Run["step"];
  progress: number;
  iteration: number;
  bestScore: number;
  message: string;
}> = [
  { step: "researcher", progress: 10, iteration: 1, bestScore: 0.12, message: "Sampling 8 related nodes from memory..." },
  { step: "researcher", progress: 35, iteration: 1, bestScore: 0.18, message: "Querying Cognition store for relevant papers..." },
  { step: "researcher", progress: 65, iteration: 1, bestScore: 0.31, message: "Generating candidate code hypothesis #1..." },
  { step: "researcher", progress: 80, iteration: 1, bestScore: 0.31, message: "Synthesizing motivation from experiment history..." },
  { step: "engineer", progress: 10, iteration: 1, bestScore: 0.45, message: "Code candidate received. Executing in sandbox..." },
  { step: "engineer", progress: 40, iteration: 1, bestScore: 0.52, message: "Running evaluator... score: 0.52" },
  { step: "engineer", progress: 80, iteration: 1, bestScore: 0.52, message: "Storing node #1 in database..." },
  { step: "analyzer", progress: 20, iteration: 1, bestScore: 0.52, message: "Comparing against best score 0.52..." },
  { step: "analyzer", progress: 60, iteration: 1, bestScore: 0.52, message: "Converging toward optimal strategy..." },
  { step: "researcher", progress: 20, iteration: 2, bestScore: 0.52, message: "Sampling 8 related nodes from memory..." },
  { step: "engineer", progress: 40, iteration: 2, bestScore: 0.67, message: "Running evaluator... score: 0.67" },
  { step: "engineer", progress: 80, iteration: 2, bestScore: 0.67, message: "Storing node #2 in database..." },
  { step: "analyzer", progress: 80, iteration: 2, bestScore: 0.71, message: "New best score! Updating best snapshot..." },
  { step: "researcher", progress: 80, iteration: 3, bestScore: 0.71, message: "Sampling 8 related nodes from memory..." },
  { step: "engineer", progress: 80, iteration: 3, bestScore: 0.79, message: "Running evaluator... score: 0.79" },
  { step: "engineer", progress: 100, iteration: 3, bestScore: 0.79, message: "Max iterations reached. Shutting down research loop." },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const tasks = useTaskStore((s) => s.tasks);
  const activeRuns = useTaskStore((s) => s.activeRuns);
  const updateRunProgress = useTaskStore((s) => s.updateRunProgress);

  const task = tasks.find((t) => t.id === id);
  const runs = Object.values(activeRuns).filter((r) => r.taskId === id);
  const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;

  const progressIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  // Auto-start demo simulation when page loads for a running task
  useEffect(() => {
    if (!task || !latestRun || latestRun.status !== "running" || startedRef.current) return;
    startedRef.current = true;

    // Short delay so user sees initial state before simulation begins
    timerRef.current = setTimeout(() => {
      const handler: ProgressHandler = (event) => {
        updateRunProgress(event.runId, {
          step: event.step,
          progress: event.progress,
          iteration: event.iteration,
          bestScore: event.bestScore,
        });
      };

      const unsub = subscribeToRun(latestRun.id, handler);

      return () => {
        unsub();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, 800);
  }, [task?.id, latestRun?.id]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Task not found.</p>
        <Link href="/tasks">
          <Button variant="outline">← Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const isRunning = latestRun?.status === "running";
  const isCompleted = latestRun?.status === "completed";
  const isFailed = latestRun?.status === "failed";
  const isPending = !latestRun || latestRun.status === "pending";

  const currentStepIndex = latestRun ? STEPS.findIndex((s) => s.id === latestRun.step) : 0;
  const progress = latestRun?.progress ?? 0;
  const bestScore = latestRun?.bestScore ?? 0;
  const iteration = latestRun?.iteration ?? 0;

  const elapsedMs = latestRun?.startedAt
    ? Date.now() - new Date(latestRun.startedAt).getTime()
    : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
              Tasks
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-foreground font-medium">{task.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
          {task.description && (
            <p className="text-muted-foreground mt-1">{task.description}</p>
          )}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>Template: {task.templateId}</div>
          <div>Model: {task.config?.model ?? "default"}</div>
        </div>
      </div>

      {/* Status banner */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 text-sm text-blue-900 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Simulation running — watching live Researcher → Engineer → Analyzer loop
        </div>
      )}
      {isPending && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md px-4 py-3 text-sm text-yellow-900">
          This task is queued. Simulation will begin shortly.
        </div>
      )}
      {isFailed && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-900">
          Task failed{latestRun.error ? `: ${latestRun.error}` : ""}.
        </div>
      )}

      {/* Research Loop Visualization */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Research Loop</h2>

        {/* Step pipeline */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const isActive = i === currentStepIndex && isRunning;
            const isPast = i < currentStepIndex;
            const isDone = isPast || (isCompleted && i <= currentStepIndex);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={[
                    "flex-1 rounded-md border px-3 py-2 text-center text-sm transition-colors",
                    isActive
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : isDone
                      ? "border-green-300 bg-green-50 text-green-900"
                      : "border-border bg-background text-muted-foreground",
                  ].join(" ")}
                >
                  <div className="font-medium">{step.label}</div>
                  {isActive && (
                    <div className="text-xs mt-0.5 opacity-70">{step.description}</div>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-4 flex-shrink-0 flex items-center justify-center text-muted-foreground">
                    <span className={isDone || isActive ? "text-green-500" : ""}>→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Iteration", value: iteration },
            { label: "Best Score", value: bestScore > 0 ? `${(bestScore * 100).toFixed(1)}%` : "—" },
            { label: "Elapsed", value: isRunning ? `${elapsedSec}s` : "—" },
            { label: "Status", value: latestRun?.status ?? "no run" },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current message */}
        {isRunning && (
          <div className="border rounded-md px-4 py-3 text-sm font-mono bg-muted/30">
            {progressIndexRef.current < DEMO_PROGRESS.length
              ? `> ${DEMO_PROGRESS[Math.min(progressIndexRef.current, DEMO_PROGRESS.length - 1)].message}`
              : "> Waiting for next step..."}
          </div>
        )}
      </div>

      {/* Nodes explored */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Nodes Explored</h2>
        <div className="space-y-2">
          {[3, 2, 1].map((n) => {
            const score = n === 3 ? 0.79 : n === 2 ? 0.67 : 0.52;
            const isBest = n === 3;
            return (
              <div
                key={n}
                className={[
                  "border rounded-md px-4 py-3 flex items-center justify-between",
                  isBest ? "border-green-400 bg-green-50" : "border-border",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  {isBest && (
                    <span className="text-xs font-bold text-green-700 bg-green-200 px-1.5 py-0.5 rounded">
                      BEST
                    </span>
                  )}
                  <span className="text-sm font-medium">Node #{n}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    iteration {n}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${isBest ? "text-green-700" : "text-muted-foreground"}`}>
                  {score.toFixed(3)}
                </span>
              </div>
            );
          })}
          {iteration === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
              No nodes generated yet. Simulation will begin shortly.
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {isCompleted && (
          <Link href={`/results/${task.id}`}>
            <Button size="lg">View Results →</Button>
          </Link>
        )}
        {isRunning && (
          <Button variant="outline" size="lg" disabled>
            Cancelling... (not implemented)
          </Button>
        )}
        {!isRunning && !isCompleted && (
          <Button size="lg" disabled>
            Task {task.status}
          </Button>
        )}
      </div>
    </div>
  );
}
