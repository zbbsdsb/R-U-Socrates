"""
In-memory SSE event store for active runs.

Each run gets a RunEventStore that:
1. Buffers all events (for replay to late-joining clients)
2. Provides an async subscription queue for live streaming
3. Is cleaned up after the run completes

This is intentionally simple: in-process asyncio queue.
No Redis, no external broker. Works perfectly for single-user local deployment.
If multi-user is needed later, swap this for Redis pub/sub.
"""

from __future__ import annotations

import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional


class RunEventStore:
    """Per-run in-memory event buffer + subscription queue."""

    _stores: Dict[str, "RunEventStore"] = {}

    def __init__(self, run_id: str):
        self.run_id = run_id
        self._events: List[Dict[str, Any]] = []
        self._subscribers: List[asyncio.Queue] = []
        self._closed = False

    @classmethod
    def get(cls, run_id: str) -> "RunEventStore":
        if run_id not in cls._stores:
            cls._stores[run_id] = cls(run_id)
        return cls._stores[run_id]

    @classmethod
    def remove(cls, run_id: str) -> None:
        cls._stores.pop(run_id, None)

    async def publish(self, event: Dict[str, Any]) -> None:
        """Publish an event to all subscribers and buffer it."""
        self._events.append(event)
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass

    async def subscribe(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Subscribe to live events. Yields events as they arrive."""
        q: asyncio.Queue = asyncio.Queue(maxsize=512)
        self._subscribers.append(q)
        try:
            # First, replay buffered events (for clients that join mid-run)
            for event in list(self._events):
                yield event

            # Then stream new events
            while not self._closed:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield event
                    if event.get("type") in ("run_complete", "run_failed"):
                        break
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield {"type": "keepalive"}
        finally:
            self._subscribers.remove(q)

    async def replay(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Replay all buffered events (for completed runs)."""
        for event in self._events:
            yield event

    async def close(self) -> None:
        """Mark the store as closed and notify all subscribers."""
        self._closed = True
        for q in list(self._subscribers):
            try:
                q.put_nowait({"type": "stream_closed"})
            except asyncio.QueueFull:
                pass
