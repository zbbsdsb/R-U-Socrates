"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TemplateCategory } from "@ru-socrates/types";

/* ── Data ─────────────────────────────────────────────────────────────── */

const TEMPLATES = [
  {
    id: "code-optimization",
    name: "Code Optimization",
    description:
      "Find a faster or more memory-efficient implementation of an algorithm. The loop will generate candidate implementations, benchmark them against the original, and converge on the best performer.",
    category: "code_optimization" as TemplateCategory,
    tags: ["performance", "algorithms", "benchmarking"],
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    accent: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    id: "architecture-design",
    name: "Architecture Design",
    description:
      "Explore alternative system designs for a given set of requirements and constraints. The loop generates design candidates, evaluates trade-offs, and surfaces the most robust architecture.",
    category: "architecture_design" as TemplateCategory,
    tags: ["system design", "scalability", "trade-offs"],
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="5" rx="1"/>
        <rect x="2" y="10" width="8" height="5" rx="1"/>
        <rect x="14" y="10" width="8" height="5" rx="1"/>
        <path d="M6 18v3M18 18v3M2 15h20"/>
      </svg>
    ),
    accent: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "algorithm-improvement",
    name: "Algorithm Improvement",
    description:
      "Improve accuracy, convergence, or robustness of an existing algorithm. The loop explores parameter spaces, evaluates against test cases, and identifies the best-performing variant.",
    category: "algorithm_improvement" as TemplateCategory,
    tags: ["ML", "optimization", "parameter tuning"],
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h4l3-9 4 18 3-9h4"/>
      </svg>
    ),
    accent: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "bug-fixing",
    name: "Bug Fixing",
    description:
      "Identify and fix a bug given a failing test case or error description. The loop generates candidate patches, runs tests, and converges on the minimal fix that makes all tests pass.",
    category: "bug_fixing" as TemplateCategory,
    tags: ["debugging", "correctness", "testing"],
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 2v4M16 2v4M3 10h18M21 8v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1z"/>
        <path d="m9 15 2 2 4-4"/>
      </svg>
    ),
    accent: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    id: "general",
    name: "General Research",
    description:
      "Open-ended exploration with no domain constraints. The loop generates hypotheses, evaluates them against criteria you define, and synthesizes insights across all iterations.",
    category: "general" as TemplateCategory,
    tags: ["open-ended", "exploration", "synthesis"],
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
        <path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    accent: "text-muted-foreground",
    bg: "bg-muted/30",
  },
];

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  code_optimization: "Code Optimization",
  architecture_design: "Architecture Design",
  algorithm_improvement: "Algorithm Improvement",
  bug_fixing: "Bug Fixing",
  general: "General",
};

/* ── Expandable detail ─────────────────────────────────────────────────── */

function TemplateCard({ template }: { template: typeof TEMPLATES[number] }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  return (
    <Card className="group transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${template.bg}`}>
              <span className={template.accent}>{template.icon}</span>
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="mt-1 text-xs font-medium uppercase tracking-wide">
                {CATEGORY_LABELS[template.category]}
              </CardDescription>
            </div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className={`text-sm leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-2"}`}>
          {template.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-2">
            <p>
              The <strong className="text-foreground">{template.name}</strong> loop follows three stages:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Researcher", desc: "Generates candidate hypotheses or solutions" },
                { label: "Engineer",   desc: "Implements and evaluates against criteria" },
                { label: "Analyzer",   desc: "Extracts insights and updates the hypothesis space" },
              ].map(({ label, desc }) => (
                <div key={label} className="rounded-md border bg-background p-2">
                  <div className="font-medium text-foreground">{label}</div>
                  <div className="mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Collapse" : "Learn More"}
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => router.push(`/tasks?template=${template.id}`)}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Choose a template to guide the research loop. Each template pre-fills the task description with domain-specific guidance.
        </p>
      </div>

      {/* Quick-nav pills */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => document.getElementById(`template-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <span className={t.accent}>{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id} id={`template-${tpl.id}`}>
            <TemplateCard template={tpl} />
          </div>
        ))}
      </div>
    </div>
  );
}
