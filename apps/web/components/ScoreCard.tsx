"use client";

interface ScoreCardProps {
  currentScore: number;
  iteration: number;
  prevBestScore: number;
}

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
  prevBestScore,
}: ScoreCardProps) {
  const hasScore = currentScore > 0;
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
    </div>
  );
}
