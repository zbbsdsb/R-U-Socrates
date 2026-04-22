"""
SQLAlchemy ORM models for R U Socrates.

Schema:
    tasks       — user-created research tasks
    runs        — individual pipeline executions of a task
    nodes       — candidate solutions explored during a run
    results     — final result snapshot for a completed run
"""

import json
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="created")  # created | running | completed | failed
    model: Mapped[str] = mapped_column(String(128), default="gpt-4o-mini")
    max_iterations: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    runs: Mapped[list["Run"]] = relationship("Run", back_populates="task", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "model": self.model,
            "max_iterations": self.max_iterations,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="running")  # running | completed | failed
    best_score: Mapped[float] = mapped_column(Float, default=0.0)
    total_nodes: Mapped[int] = mapped_column(Integer, default=0)
    total_iterations: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    task: Mapped["Task"] = relationship("Task", back_populates="runs")
    nodes: Mapped[list["ExploredNode"]] = relationship("ExploredNode", back_populates="run", cascade="all, delete-orphan")
    result: Mapped[Optional["Result"]] = relationship("Result", back_populates="run", uselist=False, cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "status": self.status,
            "best_score": self.best_score,
            "total_nodes": self.total_nodes,
            "total_iterations": self.total_iterations,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class ExploredNode(Base):
    __tablename__ = "explored_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id"), nullable=False)
    node_idx: Mapped[int] = mapped_column(Integer, nullable=False)  # iteration number
    name: Mapped[str] = mapped_column(String(255), default="")
    motivation: Mapped[str] = mapped_column(Text, default="")
    code: Mapped[str] = mapped_column(Text, default="")
    analysis: Mapped[str] = mapped_column(Text, default="")
    score: Mapped[float] = mapped_column(Float, default=0.0)
    eval_success: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["Run"] = relationship("Run", back_populates="nodes")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "run_id": self.run_id,
            "node_idx": self.node_idx,
            "name": self.name,
            "motivation": self.motivation,
            "code": self.code,
            "analysis": self.analysis,
            "score": self.score,
            "eval_success": self.eval_success,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Result(Base):
    __tablename__ = "results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id"), unique=True, nullable=False)
    best_score: Mapped[float] = mapped_column(Float, default=0.0)
    best_node_name: Mapped[str] = mapped_column(String(255), default="")
    best_node_motivation: Mapped[str] = mapped_column(Text, default="")
    best_node_code: Mapped[str] = mapped_column(Text, default="")
    best_node_analysis: Mapped[str] = mapped_column(Text, default="")
    stats_json: Mapped[str] = mapped_column(Text, default="{}")  # JSON string
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["Run"] = relationship("Run", back_populates="result")

    @property
    def stats(self) -> Dict[str, Any]:
        try:
            return json.loads(self.stats_json)
        except Exception:
            return {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "run_id": self.run_id,
            "best_score": self.best_score,
            "best_node": {
                "name": self.best_node_name,
                "motivation": self.best_node_motivation,
                "code": self.best_node_code,
                "analysis": self.best_node_analysis,
            },
            "stats": self.stats,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
