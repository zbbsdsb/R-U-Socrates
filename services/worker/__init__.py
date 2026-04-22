"""
R U Socrates — Worker Package

Public interface:
    Pipeline     — async generator that drives the research loop
    PipelineEvent — SSE event emitted by the pipeline
    EventType    — enum of all event types
    RunConfig    — configuration for a single research run
    Node         — one explored candidate
    CognitionItem — one stored insight
"""

from .models import (
    Node,
    CognitionItem,
    PipelineEvent,
    EventType,
    RunConfig,
)
from .pipeline import Pipeline

__all__ = [
    "Pipeline",
    "PipelineEvent",
    "EventType",
    "RunConfig",
    "Node",
    "CognitionItem",
]
