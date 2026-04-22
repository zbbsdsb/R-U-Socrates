"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getTask,
  subscribeToRun,
  type ApiTask,
  type PipelineEvent,
} from "@/services/taskService";
import { useTaskStore } from "@/stores/taskStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES = [
  { id: "researcher", label: "Researcher", description: "Generates next hypothesis" },
  { id: "engineer",   label: "Engineer",   description: "Evaluates candidate code" },
  { id: "analyzer",   label: "Analyzer",   description: "Extracts reusable insights" },
] as const;

type StageName = (typeof STAGES)[number]["id"];

function eventToStage(type: string): StageName | null {
  if (type.startsWith("researcher")) return "researcher";
  if (type.startsWith("engineer"))   return "engineer";
  if (type.startsWith("analyzer"))   return "analyzer";
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id: taskId } = params;

  // Remote task state
  const [task, setTask] = useState<ApiTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live pipeline state (from SSE)
  const [stage, setStage] = useState<StageName | null>(null);
  const [iteration, setIteration] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [lastMessage, setLastMessage] = useState("Connecting to research engine…");
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [runStatus, setRunStatus] = useState<"running" | "completed" | "failed">("running");

  const unsubRef = useRef<(() => void) | null>(null);

  // Fetch task details
  useEffect(() => {
    getTask(taskId)
      .then((t) => { setTask(t); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [taskId]);

  // Subscribe to SSE stream
  useEffect(() => {
    const unsub = subscribeToRun(taskId, (event: PipelineEvent) => {
      setEvents((prev) => [...prev, event]);
      setLastMessage(event.message || "");

      if (event.type === "iteration_started" || event.type.includes("_started")) {
        const s = eventToStage(event.type);
        if (s) setStage(s);
      }
      if (event.iteration > 0) setIteration(event.iteration);
      if (event.best_score > 0) setBestScore(event.best_score);
      if (event.total_nodes > 0) setTotalNodes(event.total_nodes);

      if (event.type === "run_complete") {
        setRunStatus("completed");
        setStage(null);
        // Refresh task from API so status reflects completion
        getTask(taskId).then(setTask).catch(() => {});
      }
      if (event.type === "run_failed") {
        setRunStatus("failed");
        setStage(null);
      }
    });

    unsubRef.current = unsub;
    return () => unsub();
  }, [taskId]);

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
        <p className="text-xs text-muted-foreground">Make sure the API is running: uvicorn services.api.main:app --reload</p>
        <Link href="/tasks">
          <Button variant="outline">← Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const isRunning  = runStatus === "running";
  const isComplete = runStatus === "completed";
  const isFailed   = runStatus === "failed";
  const currentStageIdx = stage ? STAGES.findIndex((s) => s.id === stage) : -1;

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">Tasks</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{task.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
          <p className="text-muted-foreground mt-1">{task.description}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground shrink-0">
          <div>Model: {task.model}</div>
          <div>Max iterations: {task.max_iterations}</div>
        </div>
      </div>

      {/* Status banner */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 text-sm text-blue-900 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Research loop running — Researcher → Engineer → Analyzer
        </div>
      )}
      {isFailed && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-900">
          Run failed. Check that your API key is set and the model is reachable.
        </div>
      )}

      {/* Stage pipeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Research Loop</h2>
        <div className="flex items-center gap-0">
          {STAGES.map((s, i) => {
            const isActive = i === currentStageIdx && isRunning;
            const isDone   = i < currentStageIdx || isComplete;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className={[
                  "flex-1 rounded-md border px-3 py-2 text-center text-sm transition-colors",
                  isActive ? "border-blue-500 bg-blue-50 text-blue-900" :
                  isDone   ? "border-green-300 bg-green-50 text-green-900" :
                             "border-border bg-background text-muted-foreground",
                ].join(" ")}>
                  <div className="font-medium">{s.label}</div>
                  {isActive && <div className="text-xs mt-0.5 opacity-70">{s.description}</div>}
                </div>
                {i < STAGES.length - 1 && (
                  <div className="w-6 flex-shrink-0 flex items-center justify-center">
                    <span className={isDone || isActive ? "text-green-500" : "text-muted-foreground"}>→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Iteration",  value: iteration > 0 ? `${iteration} / ${task.max_iterations}` : "—" },
            { label: "Best Score", value: bestScore > 0 ? `${(bestScore * 100).toFixed(1)}%` : "—" },
            { label: "Nodes",      value: totalNodes > 0 ? totalNodes : "—" },
            { label: "Status",     value: runStatus },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-semibold">{String(value)}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live message log */}
        <div className="border rounded-md bg-muted/20 p-3 font-mono text-xs space-y-0.5 max-h-48 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-muted-foreground">&gt; {lastMessage}</div>
          ) : (
            events.slice(-30).map((e, i) => (
              <div key={i} className={[
                "leading-relaxed",
                e.type === "run_complete" ? "text-green-700 font-bold" :
                e.type === "run_failed"   ? "text-red-600 font-bold" :
                e.type.endsWith("_failed") ? "text-yellow-700" :
                "text-foreground",
              ].join(" ")}>
                <span className="text-muted-foreground mr-2">[{e.type}]</span>
                {e.message}
                {e.eval_score > 0 && (
                  <span className="ml-2 text-blue-700">score={e.eval_score.toFixed(4)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analyst insights — show from analyzer events */}
      {events.filter(e => e.type === "analyzer_complete" && e.analysis).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Insights So Far</h2>
          <div className="space-y-2">
            {events
              .filter(e => e.type === "analyzer_complete" && e.analysis)
              .map((e, i) => (
                <div key={i} className="border rounded-md p-3 text-sm bg-background">
                  <div className="text-xs text-muted-foreground mb-1">
                    Iteration {e.iteration} — Analyzer
                  </div>
                  <p className="leading-relaxed text-foreground line-clamp-4">{e.analysis}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isComplete && (
          <Link href={`/results/${taskId}`}>
            <Button size="lg">View Results →</Button>
          </Link>
        )}
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Research in progress…
          </div>
        )}
        {isFailed && (
          <Link href="/tasks">
            <Button variant="outline">← Back to Tasks</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
