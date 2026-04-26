/**
 * ReasoningFeed — the live reasoning canvas.
 *
 * Flowith-inspired: dark canvas, glassmorphic panels, glowing accents,
 * auto-scroll, "New events" floating button, premium completion banner.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronDown, Circle } from "lucide-react";
import { useReasoningStore } from "@/stores/reasoningStore";
import { IterationAccordion } from "./IterationAccordion";

export function ReasoningFeed() {
  const { runStatus, activeIteration, bestScore, totalNodes, getIterations } =
    useReasoningStore();

  const [showNewEvents, setShowNewEvents] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIterCount = useRef(0);

  const iterations = getIterations();

  useEffect(() => { setMounted(true); }, []);

  // Auto-scroll on new iterations
  useEffect(() => {
    if (iterations.length !== prevIterCount.current) {
      prevIterCount.current = iterations.length;
      if (autoScroll) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowNewEvents(false);
      } else {
        setShowNewEvents(true);
      }
    }
  }, [iterations.length, autoScroll]);

  // Detect manual scroll up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(atBottom);
    if (atBottom) setShowNewEvents(false);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
    setShowNewEvents(false);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          Initializing…
        </div>
      </div>
    );
  }

  if (runStatus === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
        {/* Animated constellation dot cluster */}
        <div className="relative w-16 h-16">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400/20 border border-cyan-400/10"
              style={{
                width: `${[16, 24, 20, 28, 14][i]}px`,
                height: `${[16, 24, 20, 28, 14][i]}px`,
                top: `${[4, 2, 10, 6, 8][i]}px`,
                left: `${[2, 8, 0, 14, 10][i]}px`,
                animation: `float ${2 + i * 0.4}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes float {
              from { transform: translateY(0px) scale(1); opacity: 0.4; }
              to { transform: translateY(-4px) scale(1.05); opacity: 0.7; }
            }
          `}</style>
        </div>
        <div>
          <p className="text-sm font-medium text-white/50 mb-1">No active research</p>
          <p className="text-xs text-white/25 max-w-xs">
            Start a task to watch the reasoning process unfold in real time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">

      {/* ── New events floating button ── */}
      {showNewEvents && (
        <button
          onClick={scrollToBottom}
          className={[
            "absolute -top-2 right-0 z-10 flex items-center gap-2",
            "px-4 py-2 rounded-full text-xs font-semibold",
            "border backdrop-blur-md shadow-lg",
            "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
            "hover:bg-cyan-500/20 hover:border-cyan-500/50",
            "transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
            "animate-pulse-subtle",
          ].join(" ")}
        >
          <Circle size={6} className="fill-current animate-ping" />
          New iteration
          <ChevronDown size={12} />
        </button>
      )}

      {/* ── Feed container ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {iterations.length === 0 ? (
          /* Connecting state */
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="flex items-center gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-xl border animate-pulse"
                    style={{
                      background: ["rgba(34,211,238,0.1)", "rgba(16,185,129,0.1)", "rgba(139,92,246,0.1)"][i],
                      borderColor: ["rgba(34,211,238,0.3)", "rgba(16,185,129,0.3)", "rgba(139,92,246,0.3)"][i],
                      animationDelay: `${i * 200}ms`,
                    }}
                  />
                  <div
                    className="w-8 h-px rounded-full animate-pulse opacity-50"
                    style={{
                      background: ["linear-gradient(to right, transparent, #34d399)", "", "linear-gradient(to left, transparent, #8b5cf6)"][i],
                      animationDelay: `${i * 200 + 100}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              Connecting to research engine…
            </div>
          </div>
        ) : (
          iterations.map((iter) => (
            <IterationAccordion
              key={iter.iteration}
              data={iter}
              isActive={iter.iteration === activeIteration}
            />
          ))
        )}

        {/* Running pulse */}
        {runStatus === "running" && (
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-xs text-cyan-400/50 font-mono uppercase tracking-widest">
              Research in progress…
            </span>
          </div>
        )}

        {/* Bottom anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Completion banner ── */}
      {runStatus === "completed" && (
        <div className={[
          "mt-6 rounded-2xl border p-5 text-center space-y-3",
          "bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.04]",
          "border-emerald-500/20 backdrop-blur-sm",
          "shadow-[0_0_40px_rgba(16,185,129,0.08)]",
        ].join(" ")}>
          {/* Glow line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60" />

          <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
            <Sparkles size={16} />
            Research Complete
          </div>

          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-white/30 uppercase tracking-widest font-mono mb-1">best score</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {(bestScore * 100).toFixed(1)}
                <span className="text-sm text-white/30">%</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-white/30 uppercase tracking-widest font-mono mb-1">nodes</div>
              <div className="text-2xl font-bold font-mono text-white/60">{totalNodes}</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-white/30 uppercase tracking-widest font-mono mb-1">iterations</div>
              <div className="text-2xl font-bold font-mono text-white/60">{iterations.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Failure banner ── */}
      {runStatus === "failed" && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-red-400 font-semibold text-sm mb-2">
            ✕ Research Run Failed
          </div>
          <p className="text-xs text-red-400/50">
            Check the error details and retry with adjusted parameters.
          </p>
        </div>
      )}
    </div>
  );
}
