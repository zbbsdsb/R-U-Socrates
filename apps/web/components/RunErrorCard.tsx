"use client";

import { type PipelineEvent } from "@/services/taskService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RunErrorCardProps {
  failedEvent: PipelineEvent | null;
  allEvents: PipelineEvent[];
}

/**
 * Categorise the failure by inspecting event types and messages.
 * Returns a human-readable category + actionable guidance.
 */
function categoriseError(events: PipelineEvent[]): {
  category: string;
  headline: string;
  detail: string;
  guidance: string[];
  severity: "error" | "warning" | "info";
} {
  // Check for engineer failure with stderr
  const engineerFailed = events.find(
    (e) => e.type === "engineer_failed" && e.eval_stdout_preview
  );
  if (engineerFailed) {
    const preview = engineerFailed.eval_stdout_preview ?? "";
    if (preview.includes("bash") || preview.includes("sh:") || preview.includes("not found")) {
      return {
        category: "Environment",
        headline: "评测脚本无法启动",
        detail: "当前环境缺少 bash 或脚本无执行权限。",
        guidance: [
          "检查 services/api/.env 中 OPENAI_API_KEY 是否配置",
          "Windows 用户：确保已安装 Git Bash 或使用 python 直接调用 evaluator.py",
          "查看 Engineer's _resolve_cmd() 是否需要额外 shell 路径",
        ],
        severity: "error",
      };
    }
    if (preview.includes("TimeoutExpired") || preview.includes("timeout")) {
      return {
        category: "Timeout",
        headline: "评测执行超时",
        detail: "代码运行超过设定的 timeout 时间限制。",
        guidance: [
          "检查代码是否有无限循环或长时间阻塞操作",
          "在任务设置中增加 timeout 秒数",
          "分段验证代码，逐步增加复杂度",
        ],
        severity: "warning",
      };
    }
    if (preview.includes("SyntaxError") || preview.includes("ImportError")) {
      return {
        category: "Code Error",
        headline: "代码语法或导入错误",
        detail: "Evaluator 在运行代码时遇到 Python 错误。",
        guidance: [
          "检查生成的代码是否为有效的 Python",
          "确认所有 import 的模块在当前环境中可用",
          "在本地手动运行一次验证",
        ],
        severity: "error",
      };
    }
    return {
      category: "Evaluation",
      headline: "评测执行失败",
      detail: `Engineer 运行完成但返回非零退出码。`,
      guidance: [
        "查看下方 stderr 输出以定位具体错误",
        "确认 evaluator.py 脚本存在且路径正确",
        "在本地单独运行 evaluator 验证",
      ],
      severity: "warning",
    };
  }

  // Researcher failure
  const researcherFailed = events.find((e) => e.type === "researcher_failed");
  if (researcherFailed) {
    return {
      category: "Model",
      headline: "Researcher 生成失败",
      detail: researcherFailed.message || "Researcher 调用 LLM 时出错。",
      guidance: [
        "确认 OPENAI_API_KEY 或等效 key 已正确配置",
        "检查模型服务商是否可达（网络问题也会触发此错误）",
        "尝试切换到更稳定的模型如 gpt-4o-mini",
      ],
      severity: "error",
    };
  }

  // Analyzer failure
  const analyzerFailed = events.find((e) => e.type === "analyzer_failed");
  if (analyzerFailed) {
    return {
      category: "Model",
      headline: "Analyzer 分析失败",
      detail: analyzerFailed.message || "Analyzer 调用 LLM 时出错。",
      guidance: [
        "同上：检查 API Key 配置和网络连通性",
        "Analyzer 通常在有评测结果后调用，此时错误可能是结果格式问题",
      ],
      severity: "warning",
    };
  }

  // Generic run failure
  const runFailed = events.find((e) => e.type === "run_failed");
  if (runFailed) {
    return {
      category: "System",
      headline: "Pipeline 运行时异常",
      detail: runFailed.message || "Pipeline 执行过程中发生未知错误。",
      guidance: [
        "查看上方面板中的详细错误信息",
        "检查后端日志（uvicorn 输出）",
        "尝试降低 max_iterations 重新运行",
      ],
      severity: "error",
    };
  }

  return {
    category: "Unknown",
    headline: "运行异常",
    detail: "无法识别错误类型，请查看完整日志。",
    guidance: ["查看上方事件日志", "检查后端服务日志"],
    severity: "info",
  };
}

export function RunErrorCard({ failedEvent, allEvents }: RunErrorCardProps) {
  const { category, headline, detail, guidance, severity } = categoriseError(allEvents);

  const severityConfig = {
    error: {
      border: "border-red-200",
      bg: "bg-red-50",
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    warning: {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = severityConfig[severity];

  return (
    <Card className={`border ${config.border} ${config.bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {config.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {category}
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-sm font-semibold text-foreground">{headline}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{detail}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
          What you can do
        </div>
        <ul className="space-y-1">
          {guidance.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground">
              <span className="text-muted-foreground mt-0.5 shrink-0">—</span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
