"""
Tasks router — CRUD + SSE stream endpoint.

Endpoints:
    POST   /api/tasks                   Create task and immediately start a run
    GET    /api/tasks                   List all tasks
    GET    /api/tasks/{task_id}         Get task detail
    GET    /api/tasks/{task_id}/runs    List runs for a task
    GET    /api/tasks/{task_id}/stream  SSE: stream live research events for the latest run
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ExploredNode, Result, Run, Task
from ..schemas import TaskCreate, TaskResponse, RunResponse
from ..store import RunEventStore

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# ---------------------------------------------------------------------------
# Create task + start run
# ---------------------------------------------------------------------------

@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    payload: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create a research task and immediately queue a run."""
    task_id = str(uuid.uuid4())
    run_id = str(uuid.uuid4())

    task = Task(
        id=task_id,
        name=payload.name,
        description=payload.description,
        status="running",
        model=payload.model,
        max_iterations=payload.max_iterations,
    )
    run = Run(id=run_id, task_id=task_id, status="running")

    db.add(task)
    db.add(run)
    db.commit()
    db.refresh(task)

    # Launch pipeline in background (non-blocking)
    background_tasks.add_task(_run_pipeline, task_id, run_id, payload)

    return task.to_dict()


async def _run_pipeline(task_id: str, run_id: str, payload: TaskCreate):
    """Background task: run the research pipeline and persist events."""
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

    from pathlib import Path
    from services.worker import Pipeline, RunConfig, EventType

    # Resolve evaluator.py relative to the worker package
    worker_root = Path(__file__).parent.parent.parent / "worker"
    evaluator_path = str(worker_root / "evaluator.py")

    config = RunConfig(
        run_id=run_id,
        task_description=payload.description,
        model=payload.model,
        max_iterations=payload.max_iterations,
        eval_script=evaluator_path,
    )

    store = RunEventStore.get(run_id)

    try:
        pipeline = Pipeline(config)
        async for event in pipeline.run():
            event_dict = event.to_sse_dict()
            await store.publish(event_dict)

            # Persist completed iterations to DB
            if event.type == EventType.ITERATION_COMPLETE:
                _persist_iteration(run_id, event)
            elif event.type == EventType.RUN_COMPLETE:
                _persist_run_complete(run_id, task_id, event)
            elif event.type == EventType.RUN_FAILED:
                _persist_run_failed(run_id, task_id, str(event.message))

    except Exception as exc:
        import traceback
        error_msg = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        await store.publish({
            "type": "run_failed",
            "run_id": run_id,
            "message": error_msg,
        })
        _persist_run_failed(run_id, task_id, error_msg)
    finally:
        await store.close()


def _persist_iteration(run_id: str, event) -> None:
    """Persist iteration summary to DB (best_score, total_nodes)."""
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        run = db.get(Run, run_id)
        if run:
            run.best_score = max(run.best_score, event.best_score)
            run.total_nodes = event.total_nodes
            run.total_iterations = event.iteration
            db.commit()
    finally:
        db.close()


def _persist_run_complete(run_id: str, task_id: str, event) -> None:
    """Persist final result and update run/task status."""
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        run = db.get(Run, run_id)
        task = db.get(Task, task_id)

        if run:
            run.status = "completed"
            run.completed_at = datetime.utcnow()
            run.best_score = event.best_score
            run.total_nodes = event.total_nodes
            run.total_iterations = event.stats.get("iterations", 0) if event.stats else 0

        if task:
            task.status = "completed"
            task.updated_at = datetime.utcnow()

        # Persist result
        if event.best_node:
            bn = event.best_node
            result = Result(
                id=str(uuid.uuid4()),
                run_id=run_id,
                best_score=event.best_score,
                best_node_name=bn.get("name", ""),
                best_node_motivation=bn.get("motivation", ""),
                best_node_code=bn.get("code", ""),
                best_node_analysis=bn.get("analysis", ""),
                stats_json=json.dumps(event.stats or {}),
            )
            db.add(result)

        db.commit()
    finally:
        db.close()


def _persist_run_failed(run_id: str, task_id: str, error: str) -> None:
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        run = db.get(Run, run_id)
        task = db.get(Task, task_id)
        if run:
            run.status = "failed"
            run.error_message = error[:2000]
            run.completed_at = datetime.utcnow()
        if task:
            task.status = "failed"
            task.updated_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# List / get tasks
# ---------------------------------------------------------------------------

@router.get("", response_model=list[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [t.to_dict() for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.to_dict()


@router.get("/{task_id}/runs", response_model=list[RunResponse])
def list_runs(task_id: str, db: Session = Depends(get_db)):
    runs = db.query(Run).filter(Run.task_id == task_id).order_by(Run.started_at.desc()).all()
    return [r.to_dict() for r in runs]


# ---------------------------------------------------------------------------
# SSE stream — the transparency core
# ---------------------------------------------------------------------------

@router.get("/{task_id}/stream")
async def stream_task(task_id: str, db: Session = Depends(get_db)):
    """
    Server-Sent Events endpoint.

    Returns real-time PipelineEvent objects as they are emitted by the pipeline.
    Frontend connects with EventSource('/api/tasks/{id}/stream').

    This is the core transparency mechanism: the user watches the research
    loop unfold — Researcher → Engineer → Analyzer — in real time.
    """
    # Find the latest run for this task
    run = (
        db.query(Run)
        .filter(Run.task_id == task_id)
        .order_by(Run.started_at.desc())
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="No runs found for this task")

    run_id = run.id
    store = RunEventStore.get(run_id)

    async def event_generator() -> AsyncGenerator[str, None]:
        # If run already completed, replay persisted events then close
        if run.status in ("completed", "failed"):
            async for event_dict in store.replay():
                yield f"data: {json.dumps(event_dict)}\n\n"
            return

        # Stream live events
        async for event_dict in store.subscribe():
            yield f"data: {json.dumps(event_dict)}\n\n"
            if event_dict.get("type") in ("run_complete", "run_failed"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
