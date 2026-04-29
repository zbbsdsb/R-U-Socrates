"""
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
        penalty = min(stderr.count("\n") * 0.05, 0.3) if stderr else 0.0
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
