/**
 * AnalyzerCard — the Critic's output: Socratic analysis of experiment results.
 *
 * Flowith-style glass panel with violet glow accents.
 * Shows the analyzer's reasoning in a premium, editorial layout.
 */

"use client";

import { Sparkles } from "lucide-react";
import { type StageData } from "@/stores/reasoningStore";

interface Props {
  data: StageData;
}

function GlowBar({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-60 ${active ? "animate-pulse" : ""}`} />
  );
}

export function AnalyzerCard({ data }: Props) {
  if (data.status === "idle") {
    return (
      <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Sparkles size={16} className="text-violet-400/70" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest">
              Analyze
            </div>
            <div className="text-xs text-white/20 mt-0.5">awaiting benchmark results…</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "failed") {
    return (
      <div className="relative rounded-2xl border border-red-500/20 bg-red-500/[0.03] backdrop-blur-sm px-5 py-4">
        <GlowBar active={false} />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20">
            <Sparkles size={16} className="text-red-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-red-400/70 uppercase tracking-widest">
              Analyze
            </div>
            <div className="text-xs text-red-400/60 mt-0.5">analysis failed — skipping</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "active") {
    return (
      <div className="relative rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_0_30px_rgba(139,92,246,0.08)]">
        <GlowBar active={true} />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.3)]">
            <Sparkles size={16} className="text-violet-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
              Analyze
            </div>
            <div className="text-xs text-violet-400/50 mt-0.5">reasoning…</div>
          </div>
          <div className="ml-auto">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-violet-500/10 animate-pulse w-full" />
          <div className="h-3 rounded-full bg-violet-500/10 animate-pulse w-5/6" />
          <div className="h-3 rounded-full bg-violet-500/10 animate-pulse w-4/5" />
        </div>
      </div>
    );
  }

  // complete
  const paragraphs = (data.analysis ?? "")
    .split(/\n{1,2}/)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="relative rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.06)]">
      <GlowBar active={false} />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Sparkles size={16} className="text-violet-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-violet-400/70 uppercase tracking-widest">
            Analyze
          </div>
          <div className="text-xs text-white/30 mt-0.5">Socratic reasoning</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          <span className="text-xs text-violet-400/50 font-mono">complete</span>
        </div>
      </div>

      {/* Analysis content — editorial layout */}
      {paragraphs.length > 0 ? (
        <div className="px-5 pb-5 space-y-4">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={[
                "text-sm leading-relaxed",
                i === 0 ? "text-white/90 font-medium" : "text-white/55",
              ].join(" ")}
            >
              {para.trim()}
            </p>
          ))}

          {/* Decorative quote mark */}
          <div className="flex items-start gap-3 pt-2 border-t border-white/5">
            <span className="text-4xl text-violet-400/20 leading-none select-none font-serif">"</span>
            <p className="text-xs text-white/25 italic leading-relaxed pt-1">
              Every failure narrows the hypothesis space. The system does not guess — it eliminates.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5 text-sm text-white/30 italic">
          No analysis available.
        </div>
      )}
    </div>
  );
}
