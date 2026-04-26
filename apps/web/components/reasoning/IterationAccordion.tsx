/**
 * IterationAccordion — one iteration as a premium "thought node" on the canvas.
 *
 * Flowith-inspired: dark glass node, animated connector lines between stages,
 * spring entrance animation, neon status indicators.
 */

"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Cpu, Zap, Target } from "lucide-react";
import { type IterationData } from "@/stores/reasoningStore";
import { ResearcherCard } from "./ResearcherCard";
import { EngineerCard } from "./EngineerCard";
import { AnalyzerCard } from "./AnalyzerCard";

interface Props {
  data: IterationData;
  isActive: boolean;
}

const STAGE_ICONS = {
  researcher: { icon: Cpu,   color: "cyan",    label: "Research" },
  engineer:  { icon: Zap,   color: "emerald", label: "Engineer" },
  analyzer:   { icon: Target, color: "violet", label: "Analyze" },
} as const;

function stageStatus(data: IterationData, key: keyof typeof STAGE_ICONS) {
  return data[key].status;
}

function statusDot(status: string, color: string) {
  const colorMap: Record<string, string> = {
    cyan:    "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]",
    emerald: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]",
    violet:  "bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.9)]",
    idle:    "bg-white/20",
    failed:  "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.9)]",
  };

  const cls = status === "active"
    ? `bg-${color}-400 animate-pulse ${statusDot as unknown as string}`
    : status === "complete"
    ? colorMap[color]
    : status === "failed"
    ? colorMap.failed
    : colorMap.idle;

  // Build class string directly
  const base =
    status === "active" ? `w-2.5 h-2.5 rounded-full ${colorMap[color]} animate-pulse` :
    status === "complete" ? `w-2.5 h-2.5 rounded-full ${colorMap[color]}` :
    status === "failed" ? `w-2.5 h-2.5 rounded-full ${colorMap.failed}` :
    `w-2.5 h-2.5 rounded-full ${colorMap.idle}`;

  return <div className={base} />;
}

/** Animated connector line between stages */
function Connector({ color, done }: { color: string; done: boolean }) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="relative h-6 w-px">
        {/* Background line */}
        <div className="absolute inset-0 bg-white/5 rounded-full" />
        {/* Animated progress line */}
        <div
          className={[
            "absolute inset-0 rounded-full transition-all duration-500",
            done ? "bg-gradient-to-b from-transparent" : "bg-white/5",
          ].join(" ")}
        />
        {/* Arrow */}
        <div
          className={[
            "absolute left-1/2 -translate-x-1/2 top-0 transition-all duration-300",
            done ? "opacity-100" : "opacity-30",
          ].join(" ")}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M4 0L8 4L4 8L4 5L0 4L4 3L4 0Z"
              fill={done ? `currentColor` : "rgba(255,255,255,0.2)"}
              className={done ? `text-${color}-400` : ""}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Score badge shown in collapsed header */
function ScoreBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-black/40 border border-white/10">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: score > 0.7 ? "#34d399" : score > 0.4 ? "#fbbf24" : "#f87171",
        }}
      />
      <span className="text-xs font-mono font-medium text-white/60 tabular-nums">
        {(score * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export function IterationAccordion({ data, isActive }: Props) {
  const [open, setOpen] = useState(isActive);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open newly active iteration
  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  const { researcher, engineer, analyzer, bestScore } = data;

  const rStatus = researcher.status;
  const eStatus = engineer.status;
  const aStatus = analyzer.status;

  const rDone = rStatus === "complete" || rStatus === "failed";
  const eDone = eStatus === "complete" || eStatus === "failed";
  const aDone = aStatus === "complete" || aStatus === "failed";

  const anyActive = rStatus === "active" || eStatus === "active" || aStatus === "active";

  const isNewBest = data.iteration > 0 && bestScore > 0;

  return (
    <div
      className={[
        "relative rounded-2xl transition-all duration-500",
        "animate-in fade-in slide-in-from-bottom-4",
        mounted ? "opacity-100" : "opacity-0",
        isActive
          ? "border border-cyan-500/30 bg-cyan-500/[0.02] shadow-[0_0_40px_rgba(34,211,238,0.07)]"
          : "border border-white/5 bg-white/[0.02]",
      ].join(" ")}
      style={{ animationFillMode: "both" }}
    >
      {/* Outer glow ring for active */}
      {isActive && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 pointer-events-none" />
      )}

      {/* "New best" badge */}
      {isNewBest && (
        <div className="absolute -top-px left-6">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-b-lg bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
            ★ New Best
          </div>
        </div>
      )}

      {/* ── Collapsed header ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center gap-4 px-5 py-4 text-left",
          "hover:bg-white/[0.03] transition-colors cursor-pointer",
          "rounded-2xl",
        ].join(" ")}
      >
        {/* Iteration number — premium badge */}
        <div className={[
          "flex items-center justify-center rounded-xl w-10 h-10 shrink-0 font-mono text-sm font-bold transition-all duration-300",
          isActive
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
            : "bg-white/5 text-white/40 border border-white/10",
        ].join(" ")}>
          {data.iteration}
        </div>

        {/* Stage icons with status */}
        <div className="flex items-center gap-3 flex-1">
          {/* Researcher */}
          <div className="flex items-center gap-2" title="Research">
            <div className={[
              "flex items-center justify-center w-7 h-7 rounded-lg border transition-all",
              rStatus === "complete" ? "bg-cyan-500/10 border-cyan-500/30" :
              rStatus === "active"   ? "bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]" :
              rStatus === "failed"  ? "bg-red-500/10 border-red-500/30" :
                                     "bg-white/5 border-white/10",
            ].join(" ")}>
              <Cpu size={13} className={[
                rStatus === "complete" ? "text-cyan-400" :
                rStatus === "active"   ? "text-cyan-400" :
                rStatus === "failed"  ? "text-red-400" :
                                        "text-white/30",
              ].join(" ")} />
            </div>
            {statusDot(rStatus, "cyan")}
          </div>

          {/* Connector */}
          <div className={[
            "h-px flex-1 rounded-full transition-all duration-500 min-w-[16px]",
            rDone ? "bg-gradient-to-r from-cyan-500/60 to-emerald-500/40" : "bg-white/10",
          ].join(" ")} />

          {/* Engineer */}
          <div className="flex items-center gap-2" title="Engineer">
            <div className={[
              "flex items-center justify-center w-7 h-7 rounded-lg border transition-all",
              eStatus === "complete" ? "bg-emerald-500/10 border-emerald-500/30" :
              eStatus === "active"   ? "bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
              eStatus === "failed"  ? "bg-red-500/10 border-red-500/30" :
                                     "bg-white/5 border-white/10",
            ].join(" ")}>
              <Zap size={13} className={[
                eStatus === "complete" ? "text-emerald-400" :
                eStatus === "active"   ? "text-emerald-400" :
                eStatus === "failed"  ? "text-red-400" :
                                        "text-white/30",
              ].join(" ")} />
            </div>
            {statusDot(eStatus, "emerald")}
          </div>

          {/* Connector */}
          <div className={[
            "h-px flex-1 rounded-full transition-all duration-500 min-w-[16px]",
            eDone ? "bg-gradient-to-r from-emerald-500/60 to-violet-500/40" : "bg-white/10",
          ].join(" ")} />

          {/* Analyzer */}
          <div className="flex items-center gap-2" title="Analyze">
            <div className={[
              "flex items-center justify-center w-7 h-7 rounded-lg border transition-all",
              aStatus === "complete" ? "bg-violet-500/10 border-violet-500/30" :
              aStatus === "active"   ? "bg-violet-500/20 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]" :
              aStatus === "failed"  ? "bg-red-500/10 border-red-500/30" :
                                     "bg-white/5 border-white/10",
            ].join(" ")}>
              <Target size={13} className={[
                aStatus === "complete" ? "text-violet-400" :
                aStatus === "active"   ? "text-violet-400" :
                aStatus === "failed"  ? "text-red-400" :
                                        "text-white/30",
              ].join(" ")} />
            </div>
            {statusDot(aStatus, "violet")}
          </div>
        </div>

        {/* Score */}
        <ScoreBadge score={bestScore} />

        {/* Live indicator */}
        {anyActive && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">live</span>
          </div>
        )}

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={[
            "text-white/30 shrink-0 transition-all duration-300",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* ── Expanded body ─────────────────────────────────────────────────── */}
      {open && (
        <div className={[
          "border-t border-white/5 mx-4 mb-4 pt-4 space-y-3",
          "animate-in fade-in duration-300",
        ].join(" ")}
          style={{ animationFillMode: "both" }}
        >
          <ResearcherCard data={researcher} iteration={data.iteration} />

          {/* Connector */}
          <div className="flex items-center gap-3 pl-6">
            <div className="w-3 h-3 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
              <div className={[
                "w-1.5 h-1.5 rounded-full",
                rDone ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" : "bg-white/20",
              ].join(" ")} />
            </div>
            <div className={[
              "h-px flex-1 rounded-full",
              rDone ? "bg-gradient-to-r from-cyan-500/50 to-emerald-500/30" : "bg-white/5",
            ].join(" ")} />
            <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
              {rDone ? "compiled" : "pending"}
            </span>
          </div>

          <EngineerCard data={engineer} />

          {/* Connector */}
          <div className="flex items-center gap-3 pl-6">
            <div className="w-3 h-3 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
              <div className={[
                "w-1.5 h-1.5 rounded-full",
                eDone ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-white/20",
              ].join(" ")} />
            </div>
            <div className={[
              "h-px flex-1 rounded-full",
              eDone ? "bg-gradient-to-r from-emerald-500/50 to-violet-500/30" : "bg-white/5",
            ].join(" ")} />
            <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
              {eDone ? "benchmarked" : "pending"}
            </span>
          </div>

          <AnalyzerCard data={analyzer} />
        </div>
      )}
    </div>
  );
}
