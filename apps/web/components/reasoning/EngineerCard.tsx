/**
 * EngineerCard — the Maker's output: code implementation + benchmark results.
 *
 * Flowith-style glass panel with green glow accents.
 * Shows the engineer's code, execution result, and stdout.
 */

"use client";

import { CheckCircle2, XCircle, Terminal, Code2 } from "lucide-react";
import { type StageData } from "@/stores/reasoningStore";

interface Props {
  data: StageData;
}

function GlowBar({ color }: { color: "cyan" | "green" | "red" | "dim" }) {
  const map: Record<string, string> = {
    green: "via-emerald-400",
    red:   "via-red-400",
    cyan:  "via-cyan-400",
    dim:   "via-white/20",
  };
  return (
    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${map[color]} to-transparent opacity-60`} />
  );
}

function TerminalOutput({ text }: { text: string }) {
  const lines = text.split("\n").slice(0, 12);
  return (
    <div className="rounded-xl bg-black/70 border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <Terminal size={11} className="text-white/30" />
        <span className="text-xs text-white/25 font-mono">stdout</span>
      </div>
      <pre className="px-3 py-2 text-xs font-mono text-emerald-400/80 overflow-x-auto whitespace-pre scrollbar-thin leading-relaxed">
        {lines.join("\n")}
        {text.split("\n").length > 12 && "\n…"}
      </pre>
    </div>
  );
}

export function EngineerCard({ data }: Props) {
  if (data.status === "idle") {
    return (
      <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Code2 size={16} className="text-emerald-400/70" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest">
              Engineer
            </div>
            <div className="text-xs text-white/20 mt-0.5">awaiting hypothesis…</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "failed") {
    return (
      <div className="relative rounded-2xl border border-red-500/20 bg-red-500/[0.03] backdrop-blur-sm px-5 py-4">
        <GlowBar color="red" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20">
            <Code2 size={16} className="text-red-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-red-400/70 uppercase tracking-widest">
              Engineer
            </div>
            <div className="text-xs text-red-400/60 mt-0.5">code generation failed</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "active") {
    return (
      <div className="relative rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
        <GlowBar color="cyan" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <Code2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Engineer
            </div>
            <div className="text-xs text-emerald-400/50 mt-0.5">writing & evaluating…</div>
          </div>
          <div className="ml-auto">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-3 rounded-full bg-emerald-500/10 animate-pulse w-full" />
          <div className="h-3 rounded-full bg-emerald-500/10 animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // complete
  const { evalScore, evalSuccess, evalRuntime, evalStdoutPreview } = data;
  const score = evalScore != null ? evalScore : 0;

  return (
    <div className="relative rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.06)]">
      <GlowBar color="dim" />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Code2 size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-emerald-400/70 uppercase tracking-widest">
            Engineer
          </div>
          <div className="text-xs text-white/30 mt-0.5">implementation & benchmark</div>
        </div>

        {/* Result badge */}
        {evalSuccess !== undefined && (
          <div className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
            evalSuccess
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border border-red-500/30",
          ].join(" ")}>
            {evalSuccess
              ? <CheckCircle2 size={12} />
              : <XCircle size={12} />}
            {evalSuccess ? "PASS" : "FAIL"}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mx-5 mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-black/40 border border-white/5 px-3 py-2 text-center">
          <div className="text-xs text-white/25 font-mono uppercase tracking-wider">score</div>
          <div className={[
            "text-lg font-bold font-mono mt-0.5",
            score > 0.7 ? "text-emerald-400" :
            score > 0.4 ? "text-yellow-400" :
            "text-red-400",
          ].join(" ")}>
            {(score * 100).toFixed(1)}
            <span className="text-xs text-white/30">%</span>
          </div>
        </div>
        {evalRuntime != null && (
          <div className="rounded-xl bg-black/40 border border-white/5 px-3 py-2 text-center">
            <div className="text-xs text-white/25 font-mono uppercase tracking-wider">time</div>
            <div className="text-lg font-bold font-mono mt-0.5 text-white/60">
              {evalRuntime < 1 ? `${(evalRuntime * 1000).toFixed(0)}ms` : `${evalRuntime.toFixed(2)}s`}
            </div>
          </div>
        )}
        <div className="rounded-xl bg-black/40 border border-white/5 px-3 py-2 text-center">
          <div className="text-xs text-white/25 font-mono uppercase tracking-wider">verdict</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-white/60">
            {evalSuccess ? "✓" : "✗"}
          </div>
        </div>
      </div>

      {/* Terminal output */}
      {evalStdoutPreview && (
        <div className="mx-5 mb-4">
          <TerminalOutput text={evalStdoutPreview} />
        </div>
      )}

      {/* Score bar */}
      <div className="mx-5 mb-4">
        <div className="flex items-center justify-between text-xs text-white/25 mb-1.5 font-mono">
          <span>eval score</span>
          <span>{(score * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all duration-700",
              score > 0.7 ? "bg-gradient-to-r from-emerald-500 to-cyan-400" :
              score > 0.4 ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
              "bg-gradient-to-r from-red-500 to-orange-400",
            ].join(" ")}
            style={{ width: `${score * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
