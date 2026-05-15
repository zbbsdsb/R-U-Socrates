/**
 * settingsStore — Persistent app settings for R U Socrates.
 *
 * Stores user-configurable settings in localStorage under the key
 * "rus-settings". Settings are read on mount and persisted on every
 * write — no manual save required (though the UI batches saves for UX).
 *
 * API Keys are stored locally only. They are never sent to a third-party
 * server; they go directly to the user's own backend (services/api).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKeyMap {
  openai: string;
  deepseek: string;
  anthropic: string;
  /** Custom OpenAI-compatible provider key */
  custom: string;
}

export interface AppSettings {
  /** FastAPI backend base URL — no trailing slash */
  apiUrl: string;
  /** Default LLM model string forwarded to LiteLLM */
  defaultModel: string;
  /** Default max_iterations for new tasks */
  maxIterations: number;
  /** LLM provider API keys (stored locally, sent to own backend only) */
  apiKeys: ApiKeyMap;
  /** Custom OpenAI-compatible provider base URL */
  customProviderUrl: string;
  /** Custom evaluator Python script */
  customEvaluator: string;
}

export const DEFAULT_EVALUATOR = `"""
Default evaluator for R U Socrates.

Called by Engineer.run() as a subprocess:
    python evaluator.py <code_file> <results_json>

This evaluator runs the candidate code and scores it on correctness + efficiency.
It writes a JSON file with at least {"eval_score": <float>} to <results_json>.

Scoring heuristic (v0.1):
  - Base score: 0.5 if code runs without exception
  - +0.3 if stdout is non-empty (produced output)
  - +0.2 if runtime < 10s
  - Penalise by 0.1 per stderr line (up to -0.3)
  - Range: [0.0, 1.0]

Users can replace this file with a domain-specific evaluator that writes
their own metrics to results.json. The only requirement is that results.json
contains {"eval_score": <float in 0..1>}.
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path


def evaluate(code_file: Path, results_file: Path) -> None:
    start = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, str(code_file)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        runtime = time.time() - start
        stdout = proc.stdout.strip()
        stderr = proc.stderr.strip()
        returncode = proc.returncode

        score = 0.0

        if returncode == 0:
            score += 0.5  # ran without crashing

        if stdout:
            score += 0.3  # produced some output

        if runtime < 10.0:
            score += 0.2  # fast enough

        # Penalise stderr lines (warnings, tracebacks)
        penalty = min(stderr.count("\\n") * 0.05, 0.3) if stderr else 0.0
        score = max(0.0, score - penalty)

        result = {
            "eval_score": round(min(score, 1.0), 4),
            "success": returncode == 0,
            "runtime": round(runtime, 3),
            "stdout": stdout[:1000],
            "stderr": stderr[:500],
            "returncode": returncode,
        }

    except subprocess.TimeoutExpired:
        result = {
            "eval_score": 0.0,
            "success": False,
            "runtime": 30.0,
            "error": "Timeout after 30s",
            "stdout": "",
            "stderr": "",
        }
    except Exception as exc:
        result = {
            "eval_score": 0.0,
            "success": False,
            "runtime": 0.0,
            "error": str(exc),
            "stdout": "",
            "stderr": "",
        }

    results_file.write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python evaluator.py <code.py> <results.json>", file=sys.stderr)
        sys.exit(1)

    code_path = Path(sys.argv[1])
    results_path = Path(sys.argv[2])

    if not code_path.exists():
        results_path.write_text(
            json.dumps({"eval_score": 0.0, "success": False, "error": f"Code file not found: {code_path}"}),
            encoding="utf-8",
        )
        sys.exit(1)

    evaluate(code_path, results_path)
`;

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  defaultModel: "gpt-4o-mini",
  maxIterations: 10,
  apiKeys: {
    openai: "",
    deepseek: "",
    anthropic: "",
    custom: "",
  },
  customProviderUrl: "",
  customEvaluator: DEFAULT_EVALUATOR,
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: AppSettings;
  /** Overwrite the full settings object */
  saveSettings: (next: AppSettings) => void;
  /** Patch a single top-level field */
  patchSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  /** Reset to defaults */
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      saveSettings: (next) => set({ settings: next }),

      patchSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "rus-settings",
      // Only persist settings, not actions
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Get the current API base URL — safe in both SSR and client contexts. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return useSettingsStore.getState().settings.apiUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
