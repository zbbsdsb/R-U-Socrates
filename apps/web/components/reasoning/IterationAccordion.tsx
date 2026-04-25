/**
 * IterationAccordion — collapsible wrapper for one iteration's 3-stage reasoning chain.
 *
 * Shows: Researcher → Engineer → Analyzer cards in a glass-morphism accordion.
 * Collapsed state shows iteration number, stage progress dots, and best score.
 * Expanded state shows the full reasoning chain.
 */

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { type IterationData } from "@/stores/reasoningStore";
import { ResearcherCard } from "./ResearcherCard";
import { EngineerCard } from "./EngineerCard";
import { AnalyzerCard } from "./AnalyzerCard";

interface Props {
  data: IterationData;
  isActive: boolean;
}

const STAGE_LABELS = {
  researcher: "🔬 Research",
  engineer: "💻 Engineer",
  analyzer: "📊 Analyze",
} as const;

function getStageProgress(d: IterationData) {
  return [
    { id: "researcher", status: d.researcher.status },
    { id: "engineer",   status: d.engineer.status },
    { id: "analyzer",   status: d.analyzer.status },
  ] as const;
}

function dotColor(status: string): string {
  switch (status) {
    case "complete": return "bg-emerald-500";
    case "active":  return "bg-blue-500 animate-pulse";
    case "failed":  return "bg-red-500";
    default:        return "bg-muted";
  }
}

export function IterationAccordion({ data, isActive }: Props) {
  const [open, setOpen] = useState(isActive); // auto-open active iteration

  const stages = getStageProgress(data);
  const allDone = stages.every((s) => s.status === "complete" || s.status === "failed");
  const anyActive = stages.some((s) => s.status === "active");

  return (
    <div
      className={[
        "rounded-xl border overflow-hidden transition-all duration-200",
        isActive ? "border-blue-400 shadow-lg shadow-blue-500/10" : "border-border",
      ].join(" ")}
    >
      {/* ── Collapsed header ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          "hover:bg-muted/40 transition-colors cursor-pointer",
          anyActive ? "bg-blue-50/60" : "bg-background",
        ].join(" ")}
      >
        {/* Iteration badge */}
        <span className={[
          "inline-flex items-center justify-center rounded-lg text-xs font-bold w-8 h-8 shrink-0",
          isActive ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground",
        ].join(" ")}>
          {data.iteration}
        </span>

        {/* Stage dots */}
        <div className="flex items-center gap-1.5 flex-1">
          {stages.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <span className={["w-2 h-2 rounded-full transition-colors", dotColor(s.status)].join(" ")} />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {STAGE_LABELS[s.id as keyof typeof STAGE_LABELS]}
              </span>
            </div>
          ))}
        </div>

        {/* Best score */}
        {data.bestScore > 0 && (
          <span className="text-xs font-medium text-emerald-600 tabular-nums shrink-0">
            best {data.bestScore.toFixed(2)}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={[
            "text-muted-foreground shrink-0 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-muted/10">
          <ResearcherCard data={data.researcher} />
          <EngineerCard data={data.engineer} />
          <AnalyzerCard data={data.analyzer} />
        </div>
      )}
    </div>
  );
}
