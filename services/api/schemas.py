"""
Pydantic schemas for API request/response validation.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=10)
    model: str = Field(default="gpt-4o-mini")
    max_iterations: int = Field(default=10, ge=1, le=100)


class TaskResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    model: str
    max_iterations: int
    created_at: Optional[str]
    updated_at: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

class RunResponse(BaseModel):
    id: str
    task_id: str
    status: str
    best_score: float
    total_nodes: int
    total_iterations: int
    error_message: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Node
# ---------------------------------------------------------------------------

class NodeResponse(BaseModel):
    id: int
    run_id: str
    node_idx: int
    name: str
    motivation: str
    code: str
    analysis: str
    score: float
    eval_success: bool
    created_at: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

class BestNode(BaseModel):
    name: str
    motivation: str
    code: str
    analysis: str


class ResultResponse(BaseModel):
    id: str
    run_id: str
    best_score: float
    best_node: BestNode
    stats: Dict[str, Any]
    created_at: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# SSE event (mirrors PipelineEvent.to_sse_dict())
# ---------------------------------------------------------------------------

class SSEEvent(BaseModel):
    type: str
    run_id: str
    iteration: int = 0
    timestamp: str = ""
    message: str = ""
    node_name: str = ""
    node_motivation: str = ""
    node_code_preview: str = ""
    eval_score: float = 0.0
    eval_success: bool = False
    eval_runtime: float = 0.0
    eval_stdout_preview: str = ""
    analysis: str = ""
    best_score: float = 0.0
    best_node_id: Optional[int] = None
    total_nodes: int = 0
    best_node: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None
