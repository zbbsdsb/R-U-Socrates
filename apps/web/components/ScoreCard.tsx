"use client";

import { type PipelineEvent } from "@/services/taskService";

interface ScoreCardProps {
  currentScore: number;
  iteration: number;
  lastEvalEvent: PipelineEvent | null;
  prevBestScore: number;
}

/** Derive a human-readable confidence label from the number of nodes explored. */
function getConfidenceLabel(score: number, nodes: number): string {
  if (nodes === 0) return "No data yet";
  if (nodes === 1) return "First run — unverified";
  if (score === 0) return "No successful evaluations";
  if (score < 0.4) return "Low confidence";
  if (score < 0.7) return "Preliminary";
  if (nodes < 5) return "Moderate confidence";
  return "Reasonable confidence";
}

function getConfidenceColor(score: number, nodes: number): string {
  if (nodes === 0 || score === 0) return "text-muted-foreground";
  if (score < 0.4) return "text-red-600";
  if (score < 0.7) return "text-yellow-600";
  if (nodes < 5) return "text-blue-600";
  return "text-green-600";
}

export function ScoreCard({
  currentScore,
  iteration,
  lastEvalEvent,
  prevBestScore,
}: ScoreCardProps) {
  const hasScore = currentScore > 0;
  const hasEval = lastEvalEvent != null;
  const evalScore = lastEvalEvent?.eval_score ?? 0;
  const evalSuccess = lastEvalEvent?.eval_success ?? false;
  const evalRuntime = lastEvalEvent?.eval_runtime ?? 0;
  const delta = hasScore ? currentScore - prevBestScore : 0;
  const confidenceLabel = getConfidenceLabel(currentScore, iteration);
  const confidenceColor = getConfidenceColor(currentScore, iteration);

  return (
    <div className="space-y-3">
      {/* Score headline */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Current Score
        </div>
        <div className="flex items-end gap-3">
          <div
            className={`text-5xl font-bold tabular-nums ${
              hasScore ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {hasScore ? `${(currentScore * 100).toFixed(1)}%` : "—"}
          </div>
          {hasScore && (
            <div
              className={`text-sm font-medium mb-1.5 ${
                delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-muted-foreground"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {(delta * 100).toFixed(1)}%
              {iteration > 0 && <span className="text-muted-foreground ml-1">vs last</span>}
            </div>
          )}
        </div>
        <div className={`text-xs font-medium ${confidenceColor}`}>{confidenceLabel}</div>
      </div>

      {/* Score breakdown */}
      {hasEval && (
        <div className="border-t pt-3 space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Score Breakdown
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                evalSuccess
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  evalSuccess ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {evalSuccess ? "Eval passed" : "Eval failed"}
            </span>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Raw eval</span>
              <span className="font-medium tabular-nums">
                {evalScore > 0 ? evalScore.toFixed(4) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Runtime</span>
              <span className="font-medium tabular-nums">
                {evalRuntime > 0 ? `${evalRuntime.toFixed(1)}s` : "—"}
              </span>
            </div>
          </div>

          {/* Stdout preview if failed */}
          {!evalSuccess && lastEvalEvent?.eval_stdout_preview && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Error output</div>
              <pre className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap max-h-20">
                {lastEvalEvent.eval_stdout_preview}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* No eval yet state */}
      {!hasEval && iteration === 0 && (
        <div className="border-t pt-3">
          <div className="text-xs text-muted-foreground leading-relaxed">
            Score appears after the Engineer stage completes its first evaluation. Sit tight — the loop is warming up.
          </div>
        </div>
      )}
    </div>
  );
}
