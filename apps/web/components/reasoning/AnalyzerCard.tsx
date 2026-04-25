/**
 * AnalyzerCard — shows the Analyst's interpretation of experiment results.
 *
 * Displays:
 * - Status badge (active / complete / failed)
 * - The Socratic analysis text (4-paragraph structure)
 * - Score comparison with best so far
 */

"use client";

import { type StageData } from "@/stores/reasoningStore";

const BADGE = {
  idle:    { label: "Analyze",    cls: "bg-muted text-muted-foreground" },
  active:  { label: "Analyzing…", cls: "bg-blue-100 text-blue-700" },
  complete:{ label: "Complete",   cls: "bg-emerald-100 text-emerald-700" },
  failed:  { label: "Failed",     cls: "bg-red-100 text-red-700" },
};

export function AnalyzerCard({ data }: { data: StageData }) {
  const badge = BADGE[data.status] ?? BADGE.idle;

  return (
    <div className={[
      "rounded-xl border border-purple-200 overflow-hidden",
      data.status === "complete" ? "bg-purple-50/40" : "bg-background",
    ].join(" ")}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-purple-100">
        <span className="text-sm font-semibold text-purple-700">📊 Analyze</span>
        <span className={["text-xs px-2 py-0.5 rounded-full font-medium", badge.cls].join(" ")}>
          {badge.label}
        </span>
        {data.status === "active" && (
          <span className="ml-auto flex items-center gap-1 text-xs text-purple-600">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Running
          </span>
        )}
      </div>

      {/* Body */}
      {data.status === "complete" && data.analysis ? (
        <div className="px-4 py-3 space-y-2">
          {data.analysis
            .split(/\n{1,2}/)
            .filter(Boolean)
            .slice(0, 4)
            .map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/80">
                {para.trim()}
              </p>
            ))}
        </div>
      ) : data.status === "failed" ? (
        <div className="px-4 py-3 text-sm text-red-600">
          Analysis could not be completed.
        </div>
      ) : data.status === "active" ? (
        <div className="px-4 py-3">
          <div className="h-4 bg-purple-100 rounded animate-pulse w-3/4" />
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-muted-foreground italic">
          Awaiting candidate evaluation…
        </div>
      )}
    </div>
  );
}
