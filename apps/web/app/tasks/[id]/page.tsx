"use client";

import { useEffect, useRef, useState } from "react";
import { getTask, subscribeToRun, type ApiTask, type PipelineEvent } from "@/services/taskService";
import { ScoreCard } from "@/components/ScoreCard";
import { RunErrorCard } from "@/components/RunErrorCard";
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

  const [task, setTask] = useState<ApiTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<StageName | null>(null);
  const [iteration, setIteration] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [lastMessage, setLastMessage] = useState("Connecting to research engine…");
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [runStatus, setRunStatus] = useState<"running" | "completed" | "failed">("running");

  // Track previous best score and last eval event for ScoreCard
  const [prevBestScore, setPrevBestScore] = useState(0);
  const [lastEvalEvent, setLastEvalEvent] = useState<PipelineEvent | null>(null);

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
      if (event.best_score > 0) {
        // Track delta when score updates
        setBestScore((prev) => {
          if (event.best_score > prev) {
            setPrevBestScore(prev);
          }
          return event.best_score;
        });
      }
      if (event.total_nodes > 0) setTotalNodes(event.total_nodes);

      // Capture the most recent engineer evaluation event
      if (event.type === "engineer_complete" || event.type === "engineer_failed") {
        setLastEvalEvent(event);
      }

      if (event.type === "run_complete") {
        setRunStatus("completed");
        setStage(null);
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
  const currentStageIdx = stage ? STAGES.findIndex((s) => s.id === stage) : -1;

  // Failed event for RunErrorCard
  const failedEvent = events.find((e) => e.type === "run_failed" || e.type.endsWith("_failed"));

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
                lastEvalEvent={lastEvalEvent}
                prevBestScore={prevBestScore}
              />
            </CardContent>
          </Card>

          {/* Stats grid below score card */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Iteration", value: iteration > 0 ? `${iteration} / ${task.max_iterations}` : "—" },
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
        </div>

        {/* Right: main content */}
        <div className="space-y-6">

          {/* Run failed: show error card */}
          {isFailed && (
            <RunErrorCard failedEvent={failedEvent ?? null} allEvents={events} />
          )}

          {/* Stage pipeline */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Research Loop
            </h2>
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
          </div>

          {/* Live message log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Event Log
              </h2>
              {isRunning && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Live
                </div>
              )}
            </div>
            <div className="border rounded-md bg-muted/20 font-mono text-xs max-h-64 overflow-y-auto">
              <div className="p-3 space-y-0.5">
                {events.length === 0 ? (
                  <div className="text-muted-foreground">&gt; {lastMessage}</div>
                ) : (
                  events.slice(-40).map((e, i) => (
                    <div
                      key={i}
                      className={[
                        "leading-relaxed",
                        e.type === "run_complete"    ? "text-green-700 font-semibold" :
                        e.type === "run_failed"      ? "text-red-600 font-semibold" :
                        e.type === "engineer_failed"  ? "text-orange-700" :
                        e.type === "researcher_failed" ? "text-orange-700" :
                        e.type.endsWith("_failed")   ? "text-yellow-700" :
                        e.type === "engineer_complete" ? "text-blue-800" :
                        "text-foreground",
                      ].join(" ")}
                    >
                      <span className="text-muted-foreground mr-2 shrink-0">[{e.type.replace(/_/g, " ")}]</span>
                      <span>{e.message}</span>
                      {e.eval_score > 0 && (
                        <span className="ml-2 text-blue-600">score={e.eval_score.toFixed(4)}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analyst insights */}
          {events.filter((e) => e.type === "analyzer_complete" && e.analysis).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Insights So Far
              </h2>
              <div className="space-y-2">
                {events
                  .filter((e) => e.type === "analyzer_complete" && e.analysis)
                  .map((e, i) => (
                    <div key={i} className="border rounded-md p-3 text-sm bg-background space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Iteration {e.iteration} — Analyzer
                        </span>
                        {e.eval_score > 0 && (
                          <span className="text-xs font-medium text-blue-600 tabular-nums">
                            eval {e.eval_score.toFixed(4)}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed text-foreground">{e.analysis}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
