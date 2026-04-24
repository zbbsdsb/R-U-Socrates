"""
R U Socrates — MVP Evaluator.

Usage:
    python evaluator.py <code_file> <results_json>

The evaluator is run by Engineer.run() after the Researcher generates candidate code.
It is intentionally simple and task-agnostic:

1. Try to import the generated module and call user_defined_score() if present.
   The Researcher's prompt instructs it to define this function for task-specific scoring.
2. Fall back to execution-based scoring:
   - Runs without error: base 0.5 score
   - No timeout: bonus up to 0.3 (faster = higher)
   - Optional test harness: bonus up to 0.2 per passing test
3. Writes results to <results_json> as required by Engineer._parse_results().

The score is always in [0.0, 1.0].

NOTE: This is the Phase 1 MVP evaluator. In Phase 2, it will be replaced by a
sandboxed Docker evaluator with proper isolation and richer test harnesses.
"""

from __future__ import annotations

import importlib.util
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional


def load_module(code_path: Path) -> Optional[Any]:
    """Import code.py as a module without side effects."""
    spec = importlib.util.spec_from_file_location("_candidate", str(code_path))
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    sys.modules["_candidate"] = module
    try:
        spec.loader.exec_module(module)
    except Exception:
        # Import errors are still valid — module was syntactically loadable
        pass
    return module


def user_defined_score(module: Any) -> Optional[float]:
    """
    Look for a task-specific scoring function in the generated module.

    The Researcher prompt instructs it to define one of these when useful:
    - user_defined_score()    -> float in [0.0, 1.0]
    - score()                  -> float in [0.0, 1.0]
    """
    for attr in ("user_defined_score", "score"):
        fn = getattr(module, attr, None)
        if callable(fn):
            try:
                result = fn()
                if isinstance(result, (int, float)) and 0.0 <= float(result) <= 1.0:
                    return float(result)
            except Exception:
                pass
    return None


def execution_score(module: Any, timeout: float = 30.0) -> Dict[str, Any]:
    """
    Fallback scoring when no user-defined score function exists.

    Strategy:
    - Ran without error  -> 0.5 base
    - Completed in <1s    -> 0.3 time bonus
    - Each callable test -> +0.1 (up to 0.2 max)
    """
    score = 0.0
    bonuses: Dict[str, Any] = {}

    # Try to run any top-level function named 'run' or 'main'
    run_fn = getattr(module, "run", getattr(module, "main", None))
    if callable(run_fn):
        start = time.time()
        try:
            run_fn()
            elapsed = time.time() - start
            score += 0.5  # ran without error

            # Speed bonus: faster = better (up to 0.3)
            if elapsed < 1.0:
                time_bonus = 0.3
            elif elapsed < 5.0:
                time_bonus = 0.2
            elif elapsed < 15.0:
                time_bonus = 0.1
            else:
                time_bonus = 0.0
            score += time_bonus
            bonuses["elapsed_seconds"] = round(elapsed, 3)
            bonuses["time_bonus"] = time_bonus

        except Exception as exc:
            bonuses["execution_error"] = str(exc)[:200]
            score += 0.0
    else:
        # No run() function — module is just definitions, score purely on import
        score = 0.5
        bonuses["note"] = "no run() function — scored on import success only"

    # Look for a test harness: functions named test_* or Test
    test_names = [a for a in dir(module) if a.startswith("test_") or a == "Test"]
    test_bonus = 0.0
    test_results: Dict[str, bool] = {}
    for name in test_names[:5]:  # cap at 5 tests
        fn = getattr(module, name)
        if callable(fn):
            try:
                fn()
                test_results[name] = True
                test_bonus += 0.1
            except AssertionError:
                test_results[name] = False
            except Exception as exc:
                test_results[name] = False
                bonuses.setdefault("test_errors", {})[name] = str(exc)[:100]

    test_bonus = min(test_bonus, 0.2)  # cap test bonus
    score += test_bonus
    if test_bonus > 0:
        bonuses["tests_passed"] = sum(1 for v in test_results.values() if v)
        bonuses["tests_total"] = len(test_results)
        bonuses["test_bonus"] = round(test_bonus, 2)

    return {"score": round(min(score, 1.0), 4), "bonuses": bonuses, "test_results": test_results}


def evaluate(code_file: Path, results_file: Path, timeout: float = 30.0) -> Dict[str, Any]:
    """
    Main entry point. Loads, scores, and writes results.

    Args:
        code_file:     Path to the generated candidate code (code.py)
        results_file:  Path where results.json will be written
        timeout:       Maximum seconds for execution (enforced by Engineer, not here)

    Returns:
        The full results dict (also written to results_file)
    """
    result: Dict[str, Any] = {
        "eval_score": 0.0,
        "success": False,
        "runtime": 0.0,
        "error": None,
        "scoring_method": "none",
    }

    start = time.time()

    # Stage 1: syntax + import
    if not code_file.exists():
        result["error"] = f"code file not found: {code_file}"
        _write(results_file, result)
        return result

    try:
        module = load_module(code_file)
    except Exception as exc:
        result["error"] = f"syntax/import error: {exc}"
        _write(results_file, result)
        return result

    if module is None:
        result["error"] = "failed to load module"
        _write(results_file, result)
        return result

    # Stage 2: user-defined score
    user_score = user_defined_score(module)
    if user_score is not None:
        result["eval_score"] = user_score
        result["success"] = True
        result["scoring_method"] = "user_defined_score"
        result["runtime"] = time.time() - start
        _write(results_file, result)
        return result

    # Stage 3: execution-based fallback
    exec_result = execution_score(module, timeout)
    result["eval_score"] = exec_result["score"]
    result["success"] = True
    result["scoring_method"] = "execution"
    result["runtime"] = time.time() - start
    result["bonuses"] = exec_result.get("bonuses", {})
    result["test_results"] = exec_result.get("test_results", {})
    _write(results_file, result)
    return result


def _write(results_file: Path, data: Dict[str, Any]) -> None:
    results_file.parent.mkdir(parents=True, exist_ok=True)
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python evaluator.py <code_file> <results_json>", file=sys.stderr)
        sys.exit(1)

    code_path = Path(sys.argv[1])
    results_path = Path(sys.argv[2])

    result = evaluate(code_path, results_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
