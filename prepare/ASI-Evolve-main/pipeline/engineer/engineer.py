"""Engineer agent implementation."""

import json
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, Optional

from ..base import BaseAgent


class Engineer(BaseAgent):
    """
    Execute experiment code, parse metrics, and optionally apply an LLM judge.
    """

    def __init__(self, llm, prompt_manager):
        super().__init__(llm, prompt_manager, name="engineer")

    def run(
        self,
        code: str,
        experiment_dir: Path,
        eval_script: Optional[str] = None,
        timeout: int = 3600,
        task_description: str = "",
        judge_enabled: bool = False,
        judge_ratio: float = 0.2,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Run one experiment candidate and return structured results.
        """
        self.logger.info("[Engineer] Starting experiment")

        experiment_dir = Path(experiment_dir)
        experiment_dir.mkdir(parents=True, exist_ok=True)

        code_file = experiment_dir / "code"
        code_file.write_text(code, encoding="utf-8")
        self.logger.info(f"[Engineer] Code written to {code_file}")

        results = {}
        error = None
        success = True
        start_time = time.time()

        if eval_script:
            eval_result = self._run_script(eval_script, experiment_dir, timeout)

            if eval_result["success"]:
                results = self._parse_results(experiment_dir)

                if "temp" not in results:
                    results["temp"] = {}
                results["temp"]["stdout"] = eval_result.get("stdout", "")
                results["temp"]["stderr"] = eval_result.get("stderr", "")

                if not results.get("success", False):
                    success = False
                    error = results.get("temp", {}).get("error") or results.get("error", "Eval returned success=False")
                    self.logger.error(f"[Engineer] Eval failed: {error}")

                assert "eval_score" in results, "eval results must contain 'eval_score' field"
            else:
                success = False
                error = eval_result.get("error", "Eval script failed")
                self.logger.error(f"[Engineer] Eval failed: {error}")
                results = {
                    "temp": {
                        "stdout": eval_result.get("stdout", ""),
                        "stderr": eval_result.get("stderr", ""),
                        "error": error
                    }
                }

        runtime = time.time() - start_time

        eval_score = results.get("eval_score", 0.0)
        self.logger.info(f"[Engineer] Eval score: {eval_score:.4f}")

        judge_score = None
        if judge_enabled and success:
            judge_score = self._run_judge(
                code=code,
                results=results,
                task_description=task_description,
            )
            self.logger.info(f"[Engineer] Judge score: {judge_score:.4f}")

        if judge_enabled and judge_score is not None:
            final_score = (1 - judge_ratio) * eval_score + judge_ratio * judge_score
        else:
            final_score = eval_score

        self.logger.info(f"[Engineer] Completed in {runtime:.2f}s, success={success}, final_score={final_score:.4f}")

        result = {
            **results,
            "score": final_score,
            "runtime": runtime,
            "success": success,
        }

        if judge_enabled:
            result["judge_score"] = judge_score

        return result

    def _resolve_script_cmd(self, script_path: str) -> list:
        """
        Resolve the correct command to execute a script, cross-platform.

        Strategy:
        - Unix (bash available): use ["bash", script_path]
        - Windows (bash unavailable): extract the real interpreter from eval.sh shebang
          or fall back to running the contained Python evaluator directly
        """
        import sys, shutil, platform

        script_path = str(script_path)

        # Unix — use bash as before
        if platform.system() != "Windows":
            if shutil.which("bash"):
                return ["bash", script_path]
            raise RuntimeError("bash not found on Unix system")

        # Windows — bash may exist in Git Bash / WSL, try it first
        for shell in ["bash", "sh"]:
            if shutil.which(shell):
                return [shell, script_path]

        # Windows without bash: parse eval.sh and run the real command directly.
        # eval.sh's core action is:  python3 "$EVALUATOR_PY" "$SRC_CODE_FILE" "$RESULT_JSON"
        # We replicate that logic here to avoid POSIX shell dependency.
        self.logger.warning(
            "[Engineer] No bash found on Windows; invoking evaluator.py directly"
        )

        script_content = Path(script_path).read_text(encoding="utf-8")

        # Extract evaluator.py path from eval.sh (EVALUATOR_PY="${EXPERIMENT_DIR}/evaluator.py")
        # The script computes EXPERIMENT_DIR from cwd; we replicate that:
        # STEP_DIR = cwd; EXPERIMENT_DIR = dirname(cwd) [for non-steps dirs]
        step_dir = cwd
        if str(cwd).endswith(f"steps{os.sep}step_") or str(cwd).endswith(f"steps{os.sep}step_/"):
            experiment_dir = cwd.parent.parent
        else:
            experiment_dir = cwd.parent

        src_code_file = str(cwd / "code")
        result_json = str(cwd / "results.json")
        evaluator_py = str(experiment_dir / "evaluator.py")

        # Try python3 first, fall back to python
        python_cmd = shutil.which("python3") or shutil.which("python") or sys.executable
        return [python_cmd, evaluator_py, src_code_file, result_json]

    def _run_script(
        self,
        script_path: str,
        cwd: Path,
        timeout: int,
    ) -> Dict[str, Any]:
        """Run the benchmark evaluator with timeout handling."""
        import os

        process = None
        cmd = self._resolve_script_cmd(script_path)
        self.logger.info(f"[Engineer] Executing: {' '.join(cmd)}")

        try:
            process = subprocess.Popen(
                cmd,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                start_new_session=(platform.system() != "Windows"),
            )

            stdout, stderr = process.communicate(timeout=timeout)

            return {
                "success": process.returncode == 0,
                "stdout": stdout,
                "stderr": stderr,
                "error": stderr if process.returncode != 0 else None,
            }

        except subprocess.TimeoutExpired:
            self.logger.warning(f"[Engineer] Script timeout after {timeout}s, terminating process tree...")

            stdout = ""
            stderr = ""

            if process:
                try:
                    try:
                        import psutil
                        parent = psutil.Process(process.pid)
                        children = parent.children(recursive=True)
                    except ImportError:
                        children = []
                        self.logger.warning("[Engineer] psutil not available, may not kill all subprocesses")

                    process.terminate()
                    try:
                        stdout, stderr = process.communicate(timeout=5)
                        self.logger.info("[Engineer] Process terminated gracefully")
                    except subprocess.TimeoutExpired:
                        self.logger.warning("[Engineer] Process not responding, force killing...")
                        process.kill()

                        for child in children:
                            try:
                                child.kill()
                            except Exception:
                                pass

                        try:
                            stdout, stderr = process.communicate(timeout=2)
                        except Exception:
                            pass

                    for child in children:
                        try:
                            child.wait(timeout=1)
                        except Exception:
                            pass

                except Exception as e:
                    self.logger.error(f"[Engineer] Error during process cleanup: {e}")

            time.sleep(0.5)

            return {
                "success": False,
                "timeout": True,
                "stdout": stdout if isinstance(stdout, str) else (stdout.decode() if stdout else ""),
                "stderr": stderr if isinstance(stderr, str) else (stderr.decode() if stderr else ""),
                "error": f"Timeout after {timeout}s"
            }

        except Exception as e:
            self.logger.error(f"[Engineer] Script execution error: {e}")
            if process and process.poll() is None:
                try:
                    process.kill()
                    process.wait(timeout=2)
                except Exception:
                    pass
            return {"success": False, "error": str(e)}

    def _parse_results(self, experiment_dir: Path) -> Dict[str, Any]:
        """Parse benchmark output files produced by the evaluator."""
        results_file = experiment_dir / "results.json"
        if results_file.exists():
            try:
                with open(results_file, "r") as f:
                    results = json.load(f)
                if not isinstance(results, dict):
                    self.logger.warning("[Engineer] results.json is not a dict, ignoring")
                    return {}
                return results
            except json.JSONDecodeError as e:
                self.logger.warning(f"[Engineer] results.json is corrupted: {e}, ignoring")
                return {}
            except Exception as e:
                self.logger.error(f"[Engineer] Failed to read results.json: {e}")
                return {}

        results_txt = experiment_dir / "results.txt"
        if results_txt.exists():
            try:
                return {"raw": results_txt.read_text()}
            except Exception as e:
                self.logger.error(f"[Engineer] Failed to read results.txt: {e}")
                return {}

        return {}

    def _run_judge(
        self,
        code: str,
        results: Dict[str, Any],
        task_description: str,
    ) -> float:
        """
        Run an optional LLM judge over the code and results.
        """
        try:
            prompt = self.get_prompt(
                "judge",
                code=code,
                results=str(results),
                task_description=task_description,
            )

            result = self.llm.extract_tags(prompt, call_name="engineer_judge")

            judge_score = result.get("score", 0.0)
            try:
                judge_score = float(judge_score)
                judge_score = max(0.0, min(100.0, judge_score))
            except (ValueError, TypeError):
                self.logger.warning("[Engineer] Failed to parse judge score, using 0.0")
                judge_score = 0.0

            judge_reason = result.get("reason", result.get("reasoning", ""))
            if judge_reason:
                self.logger.info(f"[Engineer] Judge reasoning: {judge_reason[:200]}...")

            return judge_score

        except Exception as e:
            self.logger.warning(f"[Engineer] Judge failed: {e}, using eval_score only")
            return 0.0
