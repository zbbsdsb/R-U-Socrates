"use client";

import { useEffect, useState } from "react";
import { getResult, listRuns } from "@/services/taskService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Result, Run } from "@ru-socrates/types";

export default function ResultsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [r, runs] = await Promise.all([
        getResult(id),
        listRuns(id),
      ]);
      setResult(r);
      setRun(runs[runs.length - 1] ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">No results available yet.</p>
        <Link href={`/tasks/${id}`}>
          <Button variant="outline">← Back to Task</Button>
        </Link>
      </div>
    );
  }

  const { bestNode, metrics, summary } = result;

  return (
    <div className="space-y-10 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
            <Link href="/tasks">Tasks</Link>
            <span>/</span>
            <Link href={`/tasks/${id}`}>{id}</Link>
            <span>/</span>
            <span className="text-foreground">Results</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Research Result</h1>
          <p className="text-muted-foreground mt-1">
            Socratic analysis of {metrics.totalNodes} explored nodes.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground space-y-1">
          <div>Best score: <span className="font-semibold text-foreground">{(metrics.bestScore * 100).toFixed(1)}%</span></div>
          <div>Duration: <span className="font-semibold text-foreground">{Math.round(metrics.durationSeconds / 60)}m {metrics.durationSeconds % 60}s</span></div>
          <div>Model calls: <span className="font-semibold text-foreground">{metrics.modelCalls}</span></div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Nodes Explored", value: metrics.totalNodes },
          { label: "Iterations", value: metrics.totalIterations },
          { label: "Best Score", value: `${(metrics.bestScore * 100).toFixed(1)}%` },
          { label: "LLM Calls", value: metrics.modelCalls },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Socratic Explanation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What happened?</h2>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6 space-y-4">
            <p className="text-base leading-relaxed">{summary}</p>
            <p className="text-base leading-relaxed">
              After exploring <strong>{metrics.totalNodes} candidate implementations</strong> across{" "}
              <strong>{metrics.totalIterations} iterations</strong>, the system converged on an approach
              that achieved a <strong>{(metrics.bestScore * 100).toFixed(1)}%</strong> score.
            </p>
            <div className="bg-muted/50 rounded-md px-4 py-3 text-sm italic text-muted-foreground border-l-2 border-muted-foreground/30">
              The Socratic principle: every failure narrows the hypothesis space. The system does not
              guess — it eliminates.
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Best Node */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Best Solution</h2>
        <Card className="border-green-400 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{bestNode.name}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded">
                  BEST
                </span>
                <span className="font-bold text-green-700 text-lg">{(bestNode.score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Motivation */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Motivation
              </div>
              <p className="text-sm">{bestNode.motivation}</p>
            </div>

            {/* Analysis */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Analysis
              </div>
              <p className="text-sm">{bestNode.analysis}</p>
            </div>

            {/* Code */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Code
              </div>
              <pre className="bg-muted rounded-md px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {bestNode.code}
              </pre>
            </div>

            {/* Results */}
            {bestNode.results && Object.keys(bestNode.results).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Benchmark Results
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(bestNode.results).map(([k, v]) => (
                    <div key={k} className="flex justify-between border rounded px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Back */}
      <div className="flex gap-3 border-t pt-6">
        <Link href={`/tasks/${id}`}>
          <Button variant="outline">← Back to Task</Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => {
            const text = `## Research Result\n\n${summary}\n\nBest: ${bestNode.name} (${(bestNode.score * 100).toFixed(1)}%)\n\n${bestNode.code}`;
            const blob = new Blob([text], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `result-${id}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export as Markdown
        </Button>
      </div>
    </div>
  );
}
