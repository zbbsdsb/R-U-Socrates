import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ── Sections ─────────────────────────────────────────────────────────── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-sm font-semibold text-primary">
        {num}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function AgentCard({
  name,
  role,
  color,
  bg,
  tasks,
}: {
  name: string;
  role: string;
  color: string;
  bg: string;
  tasks: string[];
}) {
  return (
    <Card className={`${bg} border-0 shadow-sm`}>
      <CardHeader className="pb-3">
        <div className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${color}`}>
          {role}
        </div>
        <CardTitle className="mt-2 text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {tasks.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              {t}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-medium text-sm">{q}</h4>
      <p className="text-sm text-muted-foreground">{a}</p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function DocsPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-8 space-y-4">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Documentation
        </div>
        <h1 className="text-3xl font-bold tracking-tight">R U Socrates</h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          An open research loop engine powered by AI. Describe a problem, and R U Socrates explores it
          through a closed-loop process — generating hypotheses, testing them, and synthesizing insights
          across multiple iterations. Designed for developers and researchers who want transparent,
          verifiable, and repeatable AI-assisted investigation.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="sm">
            <Link href="/tasks">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/templates">Browse Templates</Link>
          </Button>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-10">

          {/* How it works */}
          <Section id="loop" title="How the Research Loop Works">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each task runs a closed loop of three AI agents that iterate until the{" "}
              <strong className="text-foreground">Analyzer</strong> signals convergence or the
              maximum iteration limit is reached. The loop is designed to be transparent — every
              step, every decision, and every score is visible to you.
            </p>
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm">
                {["Researcher", "Engineer", "Analyzer"].map((agent, i) => (
                  <div key={agent} className="flex items-center gap-2">
                    <div className="rounded-full border bg-muted px-3 py-1.5 font-medium text-xs">{agent}</div>
                    {i < 2 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
                <span className="text-muted-foreground ml-2">→ back to Researcher</span>
              </div>
            </div>
          </Section>

          {/* Three agents */}
          <Section id="agents" title="The Three Agents">
            <div className="grid gap-4 sm:grid-cols-3">
              <AgentCard
                name="Researcher"
                role="Hypothesis Generation"
                color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                bg="bg-blue-50/50 dark:bg-blue-950/10"
                tasks={[
                  "Analyzes the problem statement and constraints",
                  "Generates candidate approaches or hypotheses",
                  "Proposes evaluation criteria for each candidate",
                  "Maintains the exploration space across iterations",
                ]}
              />
              <AgentCard
                name="Engineer"
                role="Implementation & Execution"
                color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                bg="bg-amber-50/50 dark:bg-amber-950/10"
                tasks={[
                  "Implements candidate solutions as executable code",
                  "Runs benchmarks and tests against criteria",
                  "Scores each implementation objectively",
                  "Produces structured logs for Analyzer review",
                ]}
              />
              <AgentCard
                name="Analyzer"
                role="Insight & Convergence"
                color="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
                bg="bg-purple-50/50 dark:bg-purple-950/10"
                tasks={[
                  "Reviews Engineer scores and logs",
                  "Identifies what worked and what didn't",
                  "Prunes poor candidates from the exploration space",
                  "Decides whether to continue, refine, or converge",
                ]}
              />
            </div>
          </Section>

          {/* Step-by-step */}
          <Section id="getting-started" title="Getting Started">
            <div className="space-y-6">
              <Step
                num={1}
                title="Create a task"
                desc="Click New Task on the Tasks page. Give it a descriptive name and a clear problem statement in the description field."
              />
              <Step
                num={2}
                title="Choose a model"
                desc="Select an LLM from the dropdown. Supported models include GPT-4o, DeepSeek-V3/R1, Claude 3.5 Sonnet, and Qwen Plus/Max."
              />
              <Step
                num={3}
                title="Set max iterations"
                desc="The loop will run up to this many Researcher→Engineer→Analyzer cycles. Start with 5–10 for quick exploration, or 20+ for thorough investigation."
              />
              <Step
                num={4}
                title="Watch the live feed"
                desc="Open the task detail page to see the reasoning feed in real time. Each iteration expands to show Researcher thoughts, Engineer code, and Analyzer scores."
              />
              <Step
                num={5}
                title="Review results"
                desc="When the loop converges, head to the Results page to compare all iterations, view score trends, and read the final synthesis."
              />
            </div>
          </Section>

          {/* Templates */}
          <Section id="templates" title="Templates">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Templates pre-fill the task description with domain-specific guidance. They don't
              change the loop behavior — they just give the Researcher better context to generate
              relevant candidates.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              {[
                { name: "Code Optimization", desc: "Find faster or more memory-efficient implementations." },
                { name: "Architecture Design", desc: "Explore alternative system designs and trade-offs." },
                { name: "Algorithm Improvement", desc: "Improve accuracy, convergence, or robustness." },
                { name: "Bug Fixing", desc: "Identify and fix bugs from failing test cases." },
                { name: "General Research", desc: "Open-ended exploration with no domain constraints." },
              ].map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/templates">View all templates →</Link>
            </Button>
          </Section>

          {/* Architecture */}
          <Section id="architecture" title="Architecture">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b text-xs font-mono font-medium">
                  Tech Stack
                </div>
                <div className="divide-y">
                  {[
                    { layer: "Frontend", stack: "Next.js 14 · React 18 · TypeScript · TailwindCSS", phase: "Phase 1" },
                    { layer: "API", stack: "FastAPI · SQLAlchemy · SQLite (dev) / PostgreSQL (prod)", phase: "Phase 1" },
                    { layer: "AI Gateway", stack: "LiteLLM (unified interface for 30+ models)", phase: "Phase 1" },
                    { layer: "Research Loop", stack: "Celery · Redis · async agents (Researcher / Engineer / Analyzer)", phase: "Phase 1" },
                    { layer: "Memory & Vector", stack: "FAISS · sentence-transformers · CognitionStore", phase: "Phase 1–2" },
                    { layer: "Sandbox", stack: "Process exec + timeout (Phase 1–2) · Docker / gVisor (Phase 3)", phase: "Phase 1" },
                  ].map(({ layer, stack, phase }) => (
                    <div key={layer} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                      <div className="w-28 shrink-0 font-medium text-xs">{layer}</div>
                      <div className="flex-1 text-muted-foreground">{stack}</div>
                      <div className="shrink-0 text-xs text-muted-foreground/60">{phase}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Open source */}
          <Section id="open-source" title="Open Source">
            <p className="text-sm text-muted-foreground leading-relaxed">
              R U Socrates is open source under the{" "}
              <strong className="text-foreground">Apache-2.0</strong> (core) and{" "}
              <strong className="text-foreground">PolyForm Noncommercial</strong> (application layer)
              licenses. The research loop is transparent and verifiable — all reasoning traces are
              stored and can be reviewed, audited, or exported.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <a
                href="https://github.com/zbbsdsb/R-U-Socrates"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                View on GitHub
              </a>
              <a
                href="https://github.com/zbbsdsb/R-U-Socrates/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                Report an Issue
              </a>
              <a
                href="https://github.com/zbbsdsb/R-U-Socrates/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Discussions
              </a>
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="FAQ">
            <div className="space-y-3">
              <FaqItem
                q="What's the difference between R U Socrates and a regular LLM chat?"
                a="R U Socrates runs a closed research loop with structured roles (Researcher, Engineer, Analyzer). Every iteration is stored, scored, and visible — so you can audit the reasoning process. A chat is a single prompt-response cycle."
              />
              <FaqItem
                q="Which LLM should I use?"
                a="For speed and cost, try GPT-4o-mini or DeepSeek-V3. For complex reasoning, DeepSeek-R1 or Claude 3.5 Sonnet often outperform. Qwen Max is strong on Chinese language tasks."
              />
              <FaqItem
                q="Why are some iterations marked as pruned?"
                a="The Analyzer prunes candidates that consistently score poorly. This keeps the exploration space focused and efficient. Pruned nodes are still visible — you can review why they were discarded."
              />
              <FaqItem
                q="Can I stop a running task?"
                a="Yes — hover over a running task card on the Tasks page and click Stop. The loop halts after the current iteration finishes."
              />
              <FaqItem
                q="Where does the code run?"
                a="In Phase 1–2, code executes locally with a timeout. Phase 3 will introduce Docker-based sandboxing for isolation."
              />
              <FaqItem
                q="Is the reasoning trace stored?"
                a="Yes. Every SSE event (Researcher thoughts, Engineer output, Analyzer scores) is stored in the database. You can review the full reasoning tree after the loop completes."
              />
            </div>
          </Section>

          {/* Changelog */}
          <Section id="changelog" title="Changelog">
            <div className="space-y-4">
              {[
                { version: "Phase 1", date: "2026-Q1", items: ["Core research loop (Researcher → Engineer → Analyzer)", "SSE live reasoning feed with iteration accordion", "Tasks CRUD with cancel/delete", "5 domain-specific templates", "Dark mode + glassmorphism UI"] },
                { version: "Phase 2", date: "Planned", items: ["Reasoning Tree visualization (L2)", "Score Journey chart (L3)", "LiteLLM multi-model support", "Vector memory & distiller", "Production deployment (PostgreSQL + Docker)"] },
                { version: "Phase 3", date: "Planned", items: ["Docker sandbox isolation", "Kubernetes scale-out", "Multi-user & auth", "API rate limiting & quotas", "Plugin system for custom agents"] },
              ].map(({ version, date, items }) => (
                <div key={version} className="flex gap-4">
                  <div className="w-20 shrink-0 pt-1">
                    <div className="text-xs font-semibold text-primary">{version}</div>
                    <div className="text-xs text-muted-foreground">{date}</div>
                  </div>
                  <div className="flex-1 space-y-1.5 border-l pl-4">
                    {items.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </div>

        {/* Sticky TOC */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-1 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </div>
            {[
              { id: "loop", label: "How It Works" },
              { id: "agents", label: "Three Agents" },
              { id: "getting-started", label: "Getting Started" },
              { id: "templates", label: "Templates" },
              { id: "architecture", label: "Architecture" },
              { id: "open-source", label: "Open Source" },
              { id: "faq", label: "FAQ" },
              { id: "changelog", label: "Changelog" },
            ].map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
