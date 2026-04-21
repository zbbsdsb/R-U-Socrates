// ─── Core Enums ──────────────────────────────────────────────────────────────

export type TaskStatus =
  | "draft"
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type RunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type RunStep =
  | "researcher"
  | "engineer"
  | "analyzer"
  | "idle";

export type TemplateCategory =
  | "code_optimization"
  | "architecture_design"
  | "algorithm_improvement"
  | "bug_fixing"
  | "general";

export type CognitionType =
  | "paper"
  | "experiment"
  | "insight"
  | "constraint"
  | "heuristic";

// ─── Task ────────────────────────────────────────────────────────────────────

/** Top-level user-facing research task. */
export interface Task {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  config: TaskConfig;
  status: TaskStatus;
  createdAt: string;   // ISO 8601
  updatedAt: string;    // ISO 8601
  createdBy?: string;  // user id
}

export interface TaskConfig {
  model?: string;           // e.g. "gpt-4o", "deepseek-chat"
  maxNodes?: number;        // max evolution nodes to explore
  maxNodesPerRound?: number;
  timeoutSeconds?: number;
  parameters?: Record<string, unknown>;
}

export interface CreateTaskPayload {
  name: string;
  description?: string;
  templateId: string;
  config?: Partial<TaskConfig>;
}

export interface TaskListFilters {
  status?: TaskStatus;
  templateId?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

/** One execution instance of a task. */
export interface Run {
  id: string;
  taskId: string;
  status: RunStatus;
  step: RunStep;
  progress: number;         // 0–100
  bestScore: number;
  bestNodeId?: string;
  iteration: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface RunProgressEvent {
  runId: string;
  step: RunStep;
  progress: number;
  iteration: number;
  bestScore: number;
  bestNodeId?: string;
  message?: string;
}

// ─── Result ──────────────────────────────────────────────────────────────────

/** Final output of a completed run. */
export interface Result {
  runId: string;
  taskId: string;
  status: "completed" | "failed";
  bestNode: ResultNode;
  allNodes: ResultNode[];
  summary: string;         // Socratic-style explanation
  metrics: ResultMetrics;
  exportedAt: string;
}

export interface ResultNode {
  nodeId: number;
  name: string;
  code: string;
  score: number;
  motivation: string;
  analysis: string;
  results: Record<string, unknown>;
}

export interface ResultMetrics {
  totalNodes: number;
  totalIterations: number;
  bestScore: number;
  durationSeconds: number;
  modelCalls: number;
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  inputSchema: TemplateInputSchema;
  prompt: string;           // researcher system prompt
  evaluatorScript?: string; // optional custom evaluator path
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInputSchema {
  type: "object";
  properties: Record<string, TemplateInputField>;
  required?: string[];
}

export interface TemplateInputField {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  default?: unknown;
  enum?: string[];
  min?: number;
  max?: number;
}

export interface CreateTemplatePayload {
  name: string;
  description: string;
  category: TemplateCategory;
  inputSchema: TemplateInputSchema;
  prompt: string;
  evaluatorScript?: string;
}

// ─── Model ───────────────────────────────────────────────────────────────────

export interface Model {
  id: string;
  name: string;
  provider: ModelProvider;
  maxTokens?: number;
  supportsVision?: boolean;
  supportsFunctionCalling?: boolean;
  contextWindow?: number;
  costPer1kInputTokens?: number;
  costPer1kOutputTokens?: number;
  isAvailable: boolean;
}

export type ModelProvider =
  | "openai"
  | "deepseek"
  | "anthropic"
  | "google"
  | "ollama"
  | "litellm";

export interface ModelConfig {
  modelId: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
}

// ─── Internal: Node (aligned with ASI-Evolve pipeline/node.py) ───────────────

/** Aligned with Python Node in utils/structures.py */
export interface ResearchNode {
  id?: number;
  name: string;
  createdAt: string;
  parent: number[];
  motivation: string;
  code: string;
  results: Record<string, unknown>;
  analysis: string;
  metaInfo: Record<string, unknown>;
  visitCount: number;
  score: number;
}

// ─── Internal: CognitionItem ─────────────────────────────────────────────────

/** Domain knowledge entry in the memory system. */
export interface CognitionItem {
  id: string;
  domain: string;
  content: string;
  type: CognitionType;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  code: string;
  message: string;
  detail?: unknown;
}
