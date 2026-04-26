/**
 * ResearcherCard — the Thinker's output: motivation + code hypothesis.
 *
 * Flowith-style glass panel with neon glow accents.
 * Shows the researcher's reasoning chain as a premium thought node.
 */

"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { type StageData } from "@/stores/reasoningStore";

interface Props {
  data: StageData;
  iteration: number;
}

function GlowBar({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
  );
}

export function ResearcherCard({ data, iteration }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (data.status === "idle") {
    return (
      <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Brain size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-400/70 uppercase tracking-widest">
              Research
            </div>
            <div className="text-xs text-white/30 mt-0.5">Iteration {iteration} — pending</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "failed") {
    return (
      <div className="relative rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm px-5 py-4">
        <GlowBar active={false} />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20">
            <Brain size={16} className="text-red-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-red-400/70 uppercase tracking-widest">
              Research
            </div>
            <div className="text-xs text-red-400/60 mt-0.5">Analysis failed — skipping</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "active") {
    return (
      <div className="relative rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <GlowBar active={true} />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Brain size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              Research
            </div>
            <div className="text-xs text-cyan-400/50 mt-0.5">Thinking…</div>
          </div>
          <div className="ml-auto">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Shimmer skeleton */}
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-cyan-500/10 animate-pulse w-full" />
          <div className="h-3 rounded-full bg-cyan-500/10 animate-pulse w-4/5" />
          <div className="h-3 rounded-full bg-cyan-500/10 animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // complete
  const { nodeName, nodeMotivation, nodeCodePreview } = data;
  const hasCode = Boolean(nodeCodePreview);

  return (
    <div className="relative rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.06)]">
      <GlowBar active={false} />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Brain size={16} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-cyan-400/70 uppercase tracking-widest">
            Research
          </div>
          {nodeName && (
            <div className="text-sm font-semibold text-white/90 mt-0.5 truncate font-mono">
              {nodeName}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasCode && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{expanded ? "hide" : "preview"}</span>
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </div>
      </div>

      {/* Motivation text */}
      {nodeMotivation && (
        <div className="px-5 pb-4">
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1.5 font-mono">
            hypothesis
          </div>
          <p className="text-sm leading-relaxed text-white/70">{nodeMotivation}</p>
        </div>
      )}

      {/* Code preview */}
      {expanded && hasCode && (
        <div className="mx-4 mb-4 rounded-xl bg-black/60 border border-white/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="text-xs text-white/20 font-mono ml-2">hypothesis.py</span>
          </div>
          <pre className="px-4 py-3 text-xs font-mono text-cyan-300/80 overflow-x-auto whitespace-pre scrollbar-thin">
            {nodeCodePreview}
          </pre>
        </div>
      )}
    </div>
  );
}
