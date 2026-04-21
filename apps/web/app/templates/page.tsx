import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TemplateCategory } from "@ru-socrates/types";

const BUILT_IN_TEMPLATES = [
  {
    id: "code-optimization",
    name: "Code Optimization",
    description: "Find a faster or more memory-efficient implementation of an algorithm.",
    category: "code_optimization" as TemplateCategory,
    tags: ["performance", "algorithms"],
  },
  {
    id: "architecture-design",
    name: "Architecture Design",
    description: "Explore alternative system designs for a given set of requirements and constraints.",
    category: "architecture_design" as TemplateCategory,
    tags: ["system design", "scalability"],
  },
  {
    id: "algorithm-improvement",
    name: "Algorithm Improvement",
    description: "Improve accuracy, convergence, or robustness of an existing algorithm.",
    category: "algorithm_improvement" as TemplateCategory,
    tags: ["ML", "optimization"],
  },
  {
    id: "bug-fixing",
    name: "Bug Fixing",
    description: "Identify and fix a bug given a failing test case or error description.",
    category: "bug_fixing" as TemplateCategory,
    tags: ["debugging", "correctness"],
  },
  {
    id: "general",
    name: "General Research",
    description: "Open-ended exploration with no domain constraints.",
    category: "general" as TemplateCategory,
    tags: ["open-ended"],
  },
];

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  code_optimization: "Code Optimization",
  architecture_design: "Architecture Design",
  algorithm_improvement: "Algorithm Improvement",
  bug_fixing: "Bug Fixing",
  general: "General",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Choose a template to guide the research loop.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUILT_IN_TEMPLATES.map((tpl) => (
          <Card key={tpl.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{tpl.name}</CardTitle>
                <span className="text-xs text-muted-foreground border rounded px-2 py-0.5">
                  {CATEGORY_LABELS[tpl.category]}
                </span>
              </div>
              <CardDescription className="mt-2">{tpl.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-1">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Use Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
