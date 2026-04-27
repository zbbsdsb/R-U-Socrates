"""
Core data structures for the R U Socrates worker.

Forked from ASI-Evolve utils/structures.py and extended with:
- PipelineEvent: real-time event emitted during a research run (consumed by SSE)
- RunConfig: top-level configuration for a single research run
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Evolutionary node (unchanged from ASI-Evolve)
# ---------------------------------------------------------------------------

@dataclass
class Node:
    """One candidate explored during a research run."""

    name: str = ""
    created_at: str = ""
    parent: List[int] = field(default_factory=list)
    motivation: str = ""
    code: str = ""
    results: Dict[str, Any] = field(default_factory=dict)
    analysis: str = ""
    meta_info: Dict[str, Any] = field(default_factory=dict)
    id: Optional[int] = None
    visit_count: int = 0
    score: float = 0.0

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at,
            "parent": self.parent,
            "motivation": self.motivation,
            "code": self.code,
            "results": self.results,
            "analysis": self.analysis,
            "meta_info": self.meta_info,
            "visit_count": self.visit_count,
            "score": self.score,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Node":
        return cls(
            id=data.get("id"),
            name=data.get("name", ""),
            created_at=data.get("created_at", ""),
            parent=data.get("parent", []),
            motivation=data.get("motivation", ""),
            code=data.get("code", ""),
            results=data.get("results", {}),
            analysis=data.get("analysis", ""),
            meta_info=data.get("meta_info", {}),
            visit_count=data.get("visit_count", 0),
            score=data.get("score", 0.0),
        )

    def get_context_text(self) -> str:
        parts = [self.name, self.motivation, self.analysis]
        return " ".join(p for p in parts if p)


@dataclass
class CognitionItem:
    """One item stored in the cognition (vector) store."""

    content: str
    source: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "source": self.source,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CognitionItem":
        return cls(
            id=data.get("id"),
            content=data.get("content", ""),
            source=data.get("source", ""),
            metadata=data.get("metadata", {}),
        )


# ---------------------------------------------------------------------------
# Pipeline events — the new type that powers SSE transparency
# ---------------------------------------------------------------------------

class EventType(str, Enum):
    """All event types emitted by the pipeline async generator."""

    # Lifecycle
    RUN_STARTED = "run_started"
    RUN_COMPLETE = "run_complete"
    RUN_FAILED = "run_failed"

    # Per-iteration
    ITERATION_STARTED = "iteration_started"
    ITERATION_COMPLETE = "iteration_complete"

    # Researcher stage
    RESEARCHER_STARTED = "researcher_started"
    RESEARCHER_COMPLETE = "researcher_complete"
    RESEARCHER_FAILED = "researcher_failed"

    # Engineer stage
    ENGINEER_STARTED = "engineer_started"
    ENGINEER_COMPLETE = "engineer_complete"
    ENGINEER_FAILED = "engineer_failed"

    # Analyzer stage
    ANALYZER_STARTED = "analyzer_started"
    ANALYZER_COMPLETE = "analyzer_complete"
    ANALYZER_FAILED = "analyzer_failed"

    # Memory / cognition
    MEMORY_SAMPLED = "memory_sampled"
    COGNITION_RETRIEVED = "cognition_retrieved"

    # Informational
    LOG = "log"


@dataclass
class PipelineEvent:
    """
    A single real-time event emitted by pipeline.run().

    Every step in the research loop emits one or more events.
    The frontend receives these via SSE and renders them as they arrive —
    this is the core transparency mechanism.
    """

    type: EventType
    run_id: str
    iteration: int = 0
    timestamp: str = ""

    # Stage-specific payloads (all optional; only relevant fields populated)
    message: str = ""

    # Agent that produced this event — "researcher" | "engineer" | "analyzer" | ""
    # Required by ADR-007: L2 Reasoning Tree and L3 Score Journey use this to
    # classify events into their respective agent lanes.
    agent_type: str = ""

    # Researcher
    node_name: str = ""
    node_motivation: str = ""
    node_code_preview: str = ""   # first 300 chars of generated code

    # Engineer
    eval_score: float = 0.0
    eval_success: bool = False
    eval_runtime: float = 0.0
    eval_stdout_preview: str = ""

    # Analyzer
    analysis: str = ""

    # Iteration summary
    best_score: float = 0.0
    best_node_id: Optional[int] = None
    total_nodes: int = 0

    # Run summary (run_complete only)
    best_node: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

    def to_sse_dict(self) -> Dict[str, Any]:
        """Serialise to a dict suitable for JSON encoding in an SSE payload."""
        return {
            "type": self.type.value,
            "run_id": self.run_id,
            "iteration": self.iteration,
            "timestamp": self.timestamp,
            "message": self.message,
            "agent_type": self.agent_type,
            "node_name": self.node_name,
            "node_motivation": self.node_motivation,
            "node_code_preview": self.node_code_preview,
            "eval_score": self.eval_score,
            "eval_success": self.eval_success,
            "eval_runtime": self.eval_runtime,
            "eval_stdout_preview": self.eval_stdout_preview,
            "analysis": self.analysis,
            "best_score": self.best_score,
            "best_node_id": self.best_node_id,
            "total_nodes": self.total_nodes,
            "best_node": self.best_node,
            "stats": self.stats,
        }


# ---------------------------------------------------------------------------
# Run configuration
# ---------------------------------------------------------------------------

@dataclass
class RunConfig:
    """
    Everything the pipeline needs to start a research run.

    Created from the API request payload and passed to pipeline.run().
    """

    run_id: str
    task_description: str

    # LLM
    model: str = "gpt-4o-mini"          # LiteLLM model string
    temperature: float = 0.7
    max_tokens: int = 4096

    # Loop control
    max_iterations: int = 10
    sample_n: int = 3                    # nodes sampled per iteration

    # Evaluation
    eval_script: Optional[str] = None   # path to evaluator script; None = skip eval
    eval_timeout: int = 300             # seconds

    # Memory
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    data_dir: str = "./data"

    # Researcher behaviour
    diff_based_evolution: bool = True
    max_code_length: int = 10000

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "task_description": self.task_description,
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "max_iterations": self.max_iterations,
            "sample_n": self.sample_n,
            "eval_script": self.eval_script,
            "eval_timeout": self.eval_timeout,
            "embedding_model": self.embedding_model,
            "data_dir": self.data_dir,
            "diff_based_evolution": self.diff_based_evolution,
            "max_code_length": self.max_code_length,
        }
