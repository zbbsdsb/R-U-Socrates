"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Beaker, BrainCircuit, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ── Agent definitions ──────────────────────────────────────────────────── */

const AGENTS = [
  {
    role: "Researcher",
    description: "Decomposes your question into targeted research queries, finds evidence, and identifies blind spots.",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    icon: <Beaker className="h-5 w-5 text-blue-400" />,
    badge: "Research",
  },
  {
    role: "Engineer",
    description: "Translates findings into executable code, runs experiments, and handles errors with graceful fallback.",
    color: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/10",
    icon: <Zap className="h-5 w-5 text-violet-400" />,
    badge: "Implement",
  },
  {
    role: "Analyzer",
    description: "Scores results against your criteria, surfaces trade-offs, and decides whether to continue or stop.",
    color: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    icon: <BrainCircuit className="h-5 w-5 text-emerald-400" />,
    badge: "Evaluate",
  },
] as const;

/* ── Steps ──────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    num: "01",
    title: "Describe your research question",
    body: "Write a natural-language description and pick a template. No configuration needed.",
  },
  {
    num: "02",
    title: "Watch the loop explore in real time",
    body: "Every iteration streams live — see exactly what each agent is thinking and doing.",
  },
  {
    num: "03",
    title: "Review verified results",
    body: "Get scored outcomes with evidence chains. Stop anytime, keep the best result.",
  },
];

/* ── Use cases ───────────────────────────────────────────────────────────── */

const USE_CASES = [
  {
    title: "Code Optimization",
    description: "Find faster or more memory-efficient implementations with automated benchmarking.",
    href: "/tasks?template=code-optimization",
    tag: "Performance",
  },
  {
    title: "Architecture Design",
    description: "Explore alternative system designs with explicit trade-off analysis.",
    href: "/tasks?template=architecture-design",
    tag: "Systems",
  },
  {
    title: "Algorithm Improvement",
    description: "Improve accuracy, convergence, or robustness through iterative experimentation.",
    href: "/tasks?template=algorithm-improvement",
    tag: "ML / Research",
  },
];

/* ── Component ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [animStep, setAnimStep] = useState(0);

  return (
    <div className="flex flex-col gap-0">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-28 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[200px] h-[200px] bg-violet-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-[200px] h-[200px] bg-emerald-500/8 rounded-full blur-3xl" />
        </div>

        {/* Phase badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Phase 1 — MVP Release
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl mb-6">
          See how AI thinks.{" "}
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Every step.
          </span>{" "}
          Every decision.
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
          R U Socrates is a research engine that makes AI reasoning transparent — not a black box, but a window.
          Watch the loop explore, evaluate, and improve in real time.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mb-16">
          <Link href="/tasks">
            <Button size="lg" className="gap-2 font-semibold">
              Start Researching
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/tasks?template=general">
            <Button size="lg" variant="outline" className="gap-2">
              Try a Template
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* ── Research Loop preview ──────────────────────────────────────── */}
        <div className="w-full max-w-3xl">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl overflow-hidden">
            {/* Glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            {/* Window chrome */}
            <div className="flex items-center gap-1.5 mb-5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">
                research loop — iteration 3
              </span>
            </div>

            {/* Three agent cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
              {AGENTS.map((agent, i) => (
                <div
                  key={agent.role}
                  className={cn(
                    "rounded-xl border p-4 backdrop-blur-sm transition-all duration-500",
                    agent.border,
                    agent.color,
                    "shadow-lg",
                    animStep >= i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                  style={{ transitionDelay: `${i * 200}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{agent.badge}</span>
                    {agent.icon}
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{agent.role}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {agent.description}
                  </p>
                  {animStep >= i && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="opacity-70">done</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-muted/20 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-muted-foreground">Three steps from question to verified result.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                <div className="hidden sm:block absolute top-8 left-[calc(50%+24px)] right-0 h-px bg-gradient-to-r from-border to-transparent" />

                <div className="flex flex-col gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                    <span className="text-sm font-mono font-bold text-muted-foreground">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">What you can explore</h2>
            <p className="text-muted-foreground">
              Start with a template or go completely open-ended.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => (
              <Link key={uc.href} href={uc.href} className="group block">
                <Card className="h-full border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {uc.tag}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{uc.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {uc.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Open-ended CTA */}
          <div className="mt-8 text-center">
            <Link href="/tasks?template=general">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                Or start with a blank slate — open-ended research
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/50 bg-muted/10 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to watch AI think out loud?
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Free and open source. Runs locally, no data leaves your machine.
          </p>
          <Link href="/tasks">
            <Button size="lg" className="gap-2 font-semibold">
              Create your first task
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
