/**
 * ReasoningFeed — the full live reasoning visualization panel.
 *
 * Wraps all IterationAccordions with:
 * - Auto-scroll to latest iteration (with "New events" floating button)
 * - "Connecting…" / empty state
 * - Final summary banner
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useReasoningStore } from "@/stores/reasoningStore";
import { IterationAccordion } from "./IterationAccordion";

export function ReasoningFeed() {
  const { runStatus, activeIteration, bestScore, totalNodes, getIterations } =
    useReasoningStore();

  const [showNewEvents, setShowNewEvents] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIterCount = useRef(0);

  const iterations = getIterations();

  // Auto-scroll when new iterations appear
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

  if (runStatus === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Sparkles size={20} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Connect a running task to see the live reasoning process…
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ── New events floating button ── */}
      {showNewEvents && (
        <button
          onClick={scrollToBottom}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-medium shadow-lg hover:bg-blue-600 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          New events
          <Sparkles size={10} />
        </button>
      )}

      {/* ── Feed container ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 scroll-smooth"
      >
        {iterations.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Connecting to research engine…
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

        {/* Running indicator */}
        {runStatus === "running" && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Research in progress…</span>
          </div>
        )}

        {/* Bottom anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Final summary ── */}
      {runStatus === "completed" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-emerald-800">✓ Research complete</span>
            <div className="flex gap-4 text-xs text-emerald-700">
              <span>Best score: <strong>{(bestScore * 100).toFixed(1)}%</strong></span>
              <span>Nodes: <strong>{totalNodes}</strong></span>
            </div>
          </div>
        </div>
      )}

      {runStatus === "failed" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ✗ Research run failed. Check the error details below.
        </div>
      )}
    </div>
  );
}
