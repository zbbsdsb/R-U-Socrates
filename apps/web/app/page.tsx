import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_STATS = [
  { label: "Total Tasks", value: "3" },
  { label: "Completed", value: "1" },
  { label: "Running", value: "1" },
  { label: "Failed", value: "1" },
];

const RECENT_TASKS = [
  {
    id: "task-002",
    name: "Cache Invalidation Strategy",
    status: "running",
    statusLabel: "Running",
    template: "architecture-design",
  },
  {
    id: "task-001",
    name: "Sort Algorithm Optimization",
    status: "completed",
    statusLabel: "Completed",
    template: "code-optimization",
  },
  {
    id: "task-003",
    name: "Binary Search Bug Fix",
    status: "failed",
    statusLabel: "Failed",
    template: "bug-fixing",
  },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-600",
  running: "text-blue-600",
  failed: "text-red-600",
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Ask a question.{" "}
          <span className="text-muted-foreground">
            Run a thousand experiments.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          R U Socrates runs autonomous research loops to find answers —
          then explains them in plain language via Socratic dialogue.
        </p>
        <div className="flex gap-3">
          <Link href="/tasks">
            <Button size="lg">New Task</Button>
          </Link>
          <Link href="/templates">
            <Button size="lg" variant="outline">
              Browse Templates
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_STATS.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Tasks</h2>
          <Link href="/tasks">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>
        <div className="space-y-2">
          {RECENT_TASKS.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${STATUS_COLORS[task.status]}`}>
                      {task.statusLabel}
                    </span>
                    <span className="text-sm">{task.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {task.template}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
