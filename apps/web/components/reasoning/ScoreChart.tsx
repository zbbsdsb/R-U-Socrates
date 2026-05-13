"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Area,
  ComposedChart,
} from "recharts";
import { useReasoningStore, type IterationData } from "@/stores/reasoningStore";

interface ScoreDataPoint {
  iteration: number;
  score: number;
  isNewBest: boolean;
}

function buildScoreHistory(iterations: IterationData[]): ScoreDataPoint[] {
  const points: ScoreDataPoint[] = [];
  let runningBest = -1;

  for (const iter of iterations) {
    const score = iter.bestScore;
    const isNewBest = score > runningBest && score > 0;
    if (isNewBest) {
      runningBest = score;
    }
    points.push({
      iteration: iter.iteration,
      score: Math.round(score * 1000) / 10,
      isNewBest,
    });
  }

  return points;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScoreDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/20 bg-[#0a0a0f]/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="mb-1 text-xs text-white/50">Iteration {data.iteration}</div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold font-mono text-emerald-400">
          {data.score}%
        </span>
        {data.isNewBest && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            ★ NEW BEST
          </span>
        )}
      </div>
    </div>
  );
}

export function ScoreChart() {
  const { getIterations, runStatus } = useReasoningStore();

  const iterations = getIterations();

  const scoreData = useMemo(
    () => buildScoreHistory(iterations),
    [iterations]
  );

  const newBestPoints = useMemo(
    () => scoreData.filter((p) => p.isNewBest),
    [scoreData]
  );

  if (iterations.length === 0 || runStatus === "idle") {
    return null;
  }

  const maxScore = Math.max(...scoreData.map((p) => p.score), 50);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">Score Journey</h3>
        {scoreData.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
              <span className="text-white/40">Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-white/40">New Best</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={scoreData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="iteration"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              label={{
                value: "Iteration",
                position: "insideBottomRight",
                offset: -5,
                fill: "rgba(255,255,255,0.3)",
                fontSize: 10,
              }}
            />

            <YAxis
              domain={[0, Math.ceil(maxScore / 10) * 10]}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              width={45}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="score"
              stroke="transparent"
              fill="url(#scoreGradient)"
            />

            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#scoreGradient)"
              strokeWidth={2}
              dot={{ fill: "#34d399", strokeWidth: 0, r: 4 }}
              activeDot={{
                fill: "#34d399",
                stroke: "#0a0a0f",
                strokeWidth: 2,
                r: 6,
              }}
            />

            {newBestPoints.map((point) => (
              <ReferenceDot
                key={`best-${point.iteration}`}
                x={point.iteration}
                y={point.score}
                r={8}
                fill="#f59e0b"
                stroke="#0a0a0f"
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {scoreData.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="text-center">
            <div className="text-white/30">Final Score</div>
            <div className="font-mono text-lg font-bold text-emerald-400">
              {scoreData[scoreData.length - 1].score}%
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-white/30">New Bests</div>
            <div className="font-mono text-lg font-bold text-amber-400">
              {newBestPoints.length}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-white/30">Improvement</div>
            <div className="font-mono text-lg font-bold text-cyan-400">
              +{(scoreData[scoreData.length - 1].score - scoreData[0].score).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
