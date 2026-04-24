"""
Research pipeline — the core of R U Socrates.

Forked and rewritten from ASI-Evolve pipeline/main.py with these changes:
1. Async generator interface: `run()` yields PipelineEvent at each step
2. No file-based config: receives RunConfig directly
3. No wandb / custom logger: uses stdlib logging
4. Windows-compatible subprocess (via engineer.py)
5. LiteLLM via LLMClient (llm.py)

The pipeline is a Python package imported directly by FastAPI —
no queue, no separate process, no Docker required.
"""

from __future__ import annotations

import logging
import re
import traceback
import asyncio
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Dict, List, Optional, Any

from .models import (
    Node,
    CognitionItem,
    PipelineEvent,
    EventType,
    RunConfig,
)
from .llm import LLMClient, LLMResponse
from .memory import NodeDatabase, CognitionStore

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompt templates (inline, no Jinja2 dependency for now)
# ---------------------------------------------------------------------------

RESEARCHER_SYSTEM = """You are a research scientist tasked with evolving computational methods.
Given a task description, prior candidate solutions (nodes), and cognition items (lessons learned),
generate an improved candidate.

Respond with XML tags:
<name>short identifier for this candidate</name>
<motivation>why you believe this approach will improve over prior work</motivation>
<code>the complete Python implementation</code>
"""

RESEARCHER_PROMPT = """Task: {task_description}

Prior candidates (sampled by exploration-exploitation):
{context_nodes}

Relevant insights from previous experiments:
{cognition_items}

{base_code_section}

Generate the next improved candidate. Be specific about what you are changing and why."""


ANALYZER_SYSTEM = """You are a scientific analyst. Given experiment results, extract reusable lessons.

Respond with XML tags:
<analysis>
A 2-4 paragraph analysis explaining:
1. What this result reveals about the approach
2. Why it succeeded or failed relative to prior work  
3. What principle or insight this demonstrates for future exploration
4. A Socratic reflection: what question does this raise?
</analysis>
"""

ANALYZER_PROMPT = """Task: {task_description}

Code evaluated:
```python
{code}
```

Evaluation results:
{results}

Best prior candidate for comparison:
{best_node_info}

Analyze this experiment result and extract reusable insights."""


# ---------------------------------------------------------------------------
# Researcher
# ---------------------------------------------------------------------------

class Researcher:
    def __init__(self, llm: LLMClient, config: Optional[Dict] = None):
        self.llm = llm
        self.config = config or {}
        self.diff_based = self.config.get("diff_based_evolution", True)
        self.max_code_length = self.config.get("max_code_length", 10000)

    def run(
        self,
        task_description: str,
        context_nodes: List[Node],
        cognition_items: List[CognitionItem],
        base_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info(
            f"[Researcher] {len(context_nodes)} context nodes, "
            f"{'diff' if (self.diff_based and base_code) else 'full_rewrite'} mode"
        )

        context_text = self._format_nodes(context_nodes)
        cognition_text = self._format_cognition(cognition_items)

        if self.diff_based and base_code:
            base_section = f"Current best candidate (apply targeted improvements):\n```python\n{base_code[:3000]}\n```"
        else:
            base_section = "No prior candidate — generate a complete implementation from scratch."

        prompt = RESEARCHER_PROMPT.format(
            task_description=task_description,
            context_nodes=context_text,
            cognition_items=cognition_text,
            base_code_section=base_section,
        )

        try:
            result = self.llm.extract_tags(
                prompt,
                system_prompt=RESEARCHER_SYSTEM,
                call_name="researcher",
            )
        except ValueError:
            logger.warning("[Researcher] Tag extraction failed, using raw response")
            response = self.llm.generate(prompt, system_prompt=RESEARCHER_SYSTEM, call_name="researcher_fallback")
            result = {
                "name": f"candidate_{datetime.now().strftime('%H%M%S')}",
                "motivation": "Generated (tag extraction failed)",
                "code": self._extract_code_block(response.content),
            }

        code = result.get("code", "")
        if len(code) > self.max_code_length:
            logger.warning(f"[Researcher] Code truncated: {len(code)} → {self.max_code_length} chars")
            code = code[:self.max_code_length]

        return {
            "name": result.get("name", "unnamed"),
            "motivation": result.get("motivation", ""),
            "code": code,
        }

    def _format_nodes(self, nodes: List[Node]) -> str:
        if not nodes:
            return "(none — this is the first iteration)"
        parts = []
        for i, n in enumerate(nodes, 1):
            parts.append(
                f"[{i}] {n.name} (score={n.score:.4f})\n"
                f"Motivation: {n.motivation[:200]}\n"
                f"Analysis: {(n.analysis or 'none')[:300]}"
            )
        return "\n\n".join(parts)

    def _format_cognition(self, items: List[CognitionItem]) -> str:
        if not items:
            return "(none)"
        return "\n".join(f"• {item.content[:300]}" for item in items)

    def _extract_code_block(self, text: str) -> str:
        match = re.search(r"```python\n(.*?)```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        match = re.search(r"```\n(.*?)```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text.strip()


# ---------------------------------------------------------------------------
# Engineer
# ---------------------------------------------------------------------------

class Engineer:
    """Execute and evaluate a candidate program."""

    def run(
        self,
        code: str,
        work_dir: Path,
        eval_script: Optional[str],
        timeout: int = 300,
    ) -> Dict[str, Any]:
        import time, subprocess, json, sys, shutil, platform, os

        work_dir.mkdir(parents=True, exist_ok=True)
        code_file = work_dir / "code.py"
        code_file.write_text(code, encoding="utf-8")

        if not eval_script:
            logger.info("[Engineer] No eval_script provided, skipping evaluation")
            return {
                "eval_score": 0.0,
                "success": True,
                "runtime": 0.0,
                "stdout": "",
                "stderr": "",
                "skipped": True,
            }

        # Resolve command cross-platform (ADR-002 / Phase 0 fix)
        cmd = self._resolve_cmd(eval_script, work_dir)
        logger.info(f"[Engineer] Running: {' '.join(cmd)}")

        start = time.time()
        try:
            proc = subprocess.Popen(
                cmd,
                cwd=work_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                start_new_session=(platform.system() != "Windows"),
            )
            stdout, stderr = proc.communicate(timeout=timeout)
            runtime = time.time() - start

            if proc.returncode != 0:
                return {
                    "eval_score": 0.0,
                    "success": False,
                    "runtime": runtime,
                    "stdout": stdout[:2000],
                    "stderr": stderr[:2000],
                    "error": f"Process exited with code {proc.returncode}",
                }

            # Parse results.json written by the evaluator
            results = self._parse_results(work_dir)
            results.setdefault("eval_score", 0.0)
            results.update({
                "success": True,
                "runtime": runtime,
                "stdout": stdout[:2000],
                "stderr": stderr[:2000],
            })
            return results

        except subprocess.TimeoutExpired:
            logger.warning(f"[Engineer] Timeout after {timeout}s")
            try:
                proc.kill()
                proc.wait(timeout=2)
            except Exception:
                pass
            return {
                "eval_score": 0.0,
                "success": False,
                "runtime": timeout,
                "error": f"Timeout after {timeout}s",
                "stdout": "",
                "stderr": "",
            }

    def _resolve_cmd(self, eval_script: str, work_dir: Path) -> List[str]:
        import platform, shutil, sys
        from pathlib import Path

        eval_p = Path(eval_script)

        if platform.system() != "Windows":
            return ["bash", eval_script]

        for shell in ["bash", "sh"]:
            if shutil.which(shell):
                return [shell, eval_script]

        # Windows without bash: run evaluator.py directly.
        # eval_script may be an absolute path (set by the API layer) or a
        # relative shell script (user-provided fallback).
        python = shutil.which("python") or sys.executable
        code_file = work_dir / "code.py"
        result_json = work_dir / "results.json"

        if eval_p.is_absolute():
            # evaluator.py path set by _run_pipeline — use it directly
            evaluator = eval_p
        else:
            # User-provided relative script — copy to work_dir and run via Python
            evaluator = work_dir / "evaluator.py"

        return [python, str(evaluator), str(code_file), str(result_json)]

    def _parse_results(self, work_dir: Path) -> Dict[str, Any]:
        results_file = work_dir / "results.json"
        if results_file.exists():
            try:
                with open(results_file, encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict):
                    return data
            except Exception as e:
                logger.warning(f"[Engineer] Failed to parse results.json: {e}")
        return {}


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------

class Analyzer:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def run(
        self,
        code: str,
        results: Dict[str, Any],
        task_description: str,
        best_node: Optional[Node] = None,
    ) -> str:
        import json

        results_str = json.dumps(
            {k: v for k, v in results.items() if k not in ("stdout", "stderr")},
            indent=2,
            ensure_ascii=False,
        )

        if best_node:
            best_info = (
                f"Name: {best_node.name}, Score: {best_node.score:.4f}\n"
                f"Motivation: {best_node.motivation[:300]}"
            )
        else:
            best_info = "(no prior best — first iteration)"

        prompt = ANALYZER_PROMPT.format(
            task_description=task_description,
            code=code[:2000],
            results=results_str,
            best_node_info=best_info,
        )

        try:
            result = self.llm.extract_tags(
                prompt,
                system_prompt=ANALYZER_SYSTEM,
                call_name="analyzer",
            )
            return result.get("analysis", "")
        except ValueError:
            response = self.llm.generate(
                prompt, system_prompt=ANALYZER_SYSTEM, call_name="analyzer_fallback"
            )
            return response.content[:1000]


# ---------------------------------------------------------------------------
# Pipeline — the async generator that powers SSE
# ---------------------------------------------------------------------------

class Pipeline:
    """
    Orchestrate the research loop and yield PipelineEvent for every step.

    Usage (from FastAPI):

        async for event in Pipeline(config).run():
            yield f"data: {json.dumps(event.to_sse_dict())}\\n\\n"
    """

    def __init__(self, config: RunConfig):
        self.config = config

        # Data dirs
        data_root = Path(config.data_dir) / "runs" / config.run_id
        data_root.mkdir(parents=True, exist_ok=True)

        self.work_root = data_root / "steps"
        self.work_root.mkdir(parents=True, exist_ok=True)

        # Memory
        self.db = NodeDatabase(
            storage_dir=data_root / "nodes",
            embedding_model=config.embedding_model,
        )
        self.cognition = CognitionStore(
            storage_dir=data_root / "cognition",
            embedding_model=config.embedding_model,
        )

        # LLM
        self.llm = LLMClient(
            model=config.model,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
        )

        # Agents
        self.researcher = Researcher(
            self.llm,
            config={"diff_based_evolution": config.diff_based_evolution, "max_code_length": config.max_code_length},
        )
        self.engineer = Engineer()
        self.analyzer = Analyzer(self.llm)

    async def run(self) -> AsyncGenerator[PipelineEvent, None]:
        """
        Async generator: yields PipelineEvent for every meaningful step.

        Each event is serialisable and forwarded directly to the SSE stream.
        The frontend receives these in real time — this is how the research
        process is made visible to the user.
        """
        cfg = self.config
        run_id = cfg.run_id

        yield PipelineEvent(
            type=EventType.RUN_STARTED,
            run_id=run_id,
            message=f"Research run started. Task: {cfg.task_description[:120]}",
        )

        best_score = 0.0

        for iteration in range(1, cfg.max_iterations + 1):
            yield PipelineEvent(
                type=EventType.ITERATION_STARTED,
                run_id=run_id,
                iteration=iteration,
                message=f"Starting iteration {iteration}/{cfg.max_iterations}",
            )

            # --- Memory: sample prior nodes ---
            context_nodes = self.db.sample(cfg.sample_n)
            yield PipelineEvent(
                type=EventType.MEMORY_SAMPLED,
                run_id=run_id,
                iteration=iteration,
                total_nodes=len(self.db),
                message=f"Sampled {len(context_nodes)} context nodes from {len(self.db)} total",
            )

            # --- Memory: retrieve cognition items ---
            cognition_items: List[CognitionItem] = []
            for node in context_nodes:
                query = node.analysis or node.motivation
                if query:
                    items = self.cognition.search(query, top_k=2)
                    cognition_items.extend(items)

            yield PipelineEvent(
                type=EventType.COGNITION_RETRIEVED,
                run_id=run_id,
                iteration=iteration,
                message=f"Retrieved {len(cognition_items)} cognition items",
            )

            # --- Researcher ---
            yield PipelineEvent(
                type=EventType.RESEARCHER_STARTED,
                run_id=run_id,
                iteration=iteration,
                message="Researcher generating next candidate…",
            )

            base_code = context_nodes[0].code if (cfg.diff_based_evolution and context_nodes) else None

            try:
                researcher_result = await asyncio.get_running_loop().run_in_executor(
                    None,
                    lambda: self.researcher.run(
                        task_description=cfg.task_description,
                        context_nodes=context_nodes,
                        cognition_items=cognition_items,
                        base_code=base_code,
                    ),
                )
            except Exception as exc:
                logger.error(f"[Pipeline] Researcher failed at iteration {iteration}: {exc}")
                yield PipelineEvent(
                    type=EventType.RESEARCHER_FAILED,
                    run_id=run_id,
                    iteration=iteration,
                    message=f"Researcher error: {type(exc).__name__}: {exc}",
                )
                continue

            node = Node(
                name=researcher_result["name"],
                motivation=researcher_result["motivation"],
                code=researcher_result["code"],
                parent=[n.id for n in context_nodes if n.id is not None],
            )

            yield PipelineEvent(
                type=EventType.RESEARCHER_COMPLETE,
                run_id=run_id,
                iteration=iteration,
                node_name=node.name,
                node_motivation=node.motivation,
                node_code_preview=node.code[:300],
                message=f"Researcher generated: {node.name}",
            )

            # --- Engineer ---
            work_dir = self.work_root / f"iter_{iteration:03d}"

            yield PipelineEvent(
                type=EventType.ENGINEER_STARTED,
                run_id=run_id,
                iteration=iteration,
                message="Engineer evaluating candidate…",
            )

            try:
                engineer_result = await asyncio.get_running_loop().run_in_executor(
                    None,
                    lambda: self.engineer.run(
                        code=node.code,
                        work_dir=work_dir,
                        eval_script=cfg.eval_script,
                        timeout=cfg.eval_timeout,
                    ),
                )
            except Exception as exc:
                logger.error(f"[Pipeline] Engineer failed at iteration {iteration}: {exc}")
                engineer_result = {
                    "eval_score": 0.0,
                    "success": False,
                    "error": str(exc),
                    "runtime": 0.0,
                }

            node.score = engineer_result.get("eval_score", 0.0)
            node.results = {k: v for k, v in engineer_result.items() if k not in ("stdout", "stderr")}
            node.meta_info = {
                "success": engineer_result.get("success", False),
                "runtime": engineer_result.get("runtime", 0.0),
                "error": engineer_result.get("error"),
            }

            yield PipelineEvent(
                type=EventType.ENGINEER_COMPLETE if engineer_result.get("success", False) else EventType.ENGINEER_FAILED,
                run_id=run_id,
                iteration=iteration,
                eval_score=node.score,
                eval_success=engineer_result.get("success", False),
                eval_runtime=engineer_result.get("runtime", 0.0),
                eval_stdout_preview=engineer_result.get("stdout", "")[:300],
                message=f"Engineer: score={node.score:.4f}, success={engineer_result.get('success', False)}",
            )

            # --- Analyzer ---
            yield PipelineEvent(
                type=EventType.ANALYZER_STARTED,
                run_id=run_id,
                iteration=iteration,
                message="Analyzer interpreting results…",
            )

            best_node_for_comparison = self.db.get_best()

            try:
                analysis = await asyncio.get_running_loop().run_in_executor(
                    None,
                    lambda: self.analyzer.run(
                        code=node.code,
                        results=engineer_result,
                        task_description=cfg.task_description,
                        best_node=best_node_for_comparison,
                    ),
                )
            except Exception as exc:
                logger.error(f"[Pipeline] Analyzer failed at iteration {iteration}: {exc}")
                analysis = f"Analysis failed: {exc}"

            node.analysis = analysis

            yield PipelineEvent(
                type=EventType.ANALYZER_COMPLETE,
                run_id=run_id,
                iteration=iteration,
                analysis=analysis,
                message="Analyzer complete",
            )

            # --- Persist node ---
            node_id = self.db.add(node)

            # Distill analysis into cognition
            if analysis and len(analysis) > 50:
                self.cognition.add(
                    CognitionItem(content=analysis, source=f"run:{run_id}/iter:{iteration}")
                )

            # Update best score
            if node.score > best_score:
                best_score = node.score

            best_node = self.db.get_best()

            yield PipelineEvent(
                type=EventType.ITERATION_COMPLETE,
                run_id=run_id,
                iteration=iteration,
                best_score=best_score,
                best_node_id=best_node.id if best_node else None,
                total_nodes=len(self.db),
                message=f"Iteration {iteration} complete. Best score so far: {best_score:.4f}",
            )

        # --- Run complete ---
        best_node = self.db.get_best()
        yield PipelineEvent(
            type=EventType.RUN_COMPLETE,
            run_id=run_id,
            best_score=best_score,
            total_nodes=len(self.db),
            best_node=best_node.to_dict() if best_node else None,
            stats={
                "iterations": cfg.max_iterations,
                "total_nodes": len(self.db),
                "best_score": best_score,
                "model": cfg.model,
            },
            message=f"Research run complete. Best score: {best_score:.4f}",
        )
