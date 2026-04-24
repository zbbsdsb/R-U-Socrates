"""
LiteLLM wrapper for R U Socrates.

Replaces ASI-Evolve's direct OpenAI client with LiteLLM, giving us:
- A single interface for 100+ models (OpenAI, Anthropic, Gemini, Ollama, DeepSeek, …)
- No custom adapters to maintain (ADR-003)
- Automatic retry and timeout handling

Usage:
    llm = LLMClient(model="gpt-4o-mini", api_key="sk-...")
    response = llm.generate("What is attention?")
    tags = llm.extract_tags(prompt)       # returns {"name": ..., "code": ...}
"""

from __future__ import annotations

import json
import re
import time
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import litellm
from litellm import completion



logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Minimal LLMResponse (defined here to avoid circular imports)
# ---------------------------------------------------------------------------

from dataclasses import dataclass, field


@dataclass
class LLMResponse:
    content: str
    usage: Dict[str, int] = field(default_factory=dict)
    model: str = ""
    call_time: float = 0.0


# ---------------------------------------------------------------------------
# LiteLLM-backed client
# ---------------------------------------------------------------------------

class LLMClient:
    """
    Thin LiteLLM wrapper with the same interface as ASI-Evolve's LLMClient.

    Key differences from the original:
    - Uses litellm.completion instead of openai.OpenAI
    - model string follows LiteLLM convention: "gpt-4o-mini", "ollama/llama3", etc.
    - No wandb / custom logger dependencies
    """

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        timeout: int = 120,
        retry_times: int = 3,
        retry_delay: int = 5,
    ):
        self.model = model
        self.api_key = api_key
        self.api_base = api_base
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.retry_times = retry_times
        self.retry_delay = retry_delay

        # Pass api_key / api_base to litellm via environment or direct param
        if api_key:
            litellm.api_key = api_key
        if api_base:
            litellm.api_base = api_base

    def chat(
        self,
        messages: List[Dict[str, str]],
        call_name: Optional[str] = None,
        **kwargs,
    ) -> LLMResponse:
        """Send a chat-completions request via LiteLLM."""
        params = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "timeout": self.timeout,
            **kwargs,
        }
        if self.api_base:
            params["api_base"] = self.api_base

        last_error: Optional[Exception] = None

        for attempt in range(self.retry_times):
            try:
                start = time.time()
                response = completion(**params)
                elapsed = time.time() - start

                content = response.choices[0].message.content or ""
                usage: Dict[str, int] = {}
                if response.usage:
                    usage = {
                        "prompt_tokens": response.usage.prompt_tokens or 0,
                        "completion_tokens": response.usage.completion_tokens or 0,
                        "total_tokens": response.usage.total_tokens or 0,
                    }

                logger.debug(
                    f"[LLM] {call_name or 'call'} | model={self.model} "
                    f"| tokens={usage.get('total_tokens', '?')} | time={elapsed:.2f}s"
                )

                return LLMResponse(
                    content=content,
                    usage=usage,
                    model=self.model,
                    call_time=elapsed,
                )

            except Exception as exc:
                last_error = exc
                logger.warning(
                    f"[LLM] {call_name or 'call'} failed "
                    f"(attempt {attempt + 1}/{self.retry_times}): {exc}"
                )
                if attempt < self.retry_times - 1:
                    time.sleep(self.retry_delay)

        raise last_error  # type: ignore[misc]

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        call_name: Optional[str] = None,
        **kwargs,
    ) -> LLMResponse:
        """Convenience wrapper: single user message."""
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return self.chat(messages, call_name=call_name, **kwargs)

    def extract_tags(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        call_name: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Call the LLM and extract XML-like tags from the response.

        Example response:
            <name>LinearAttention</name>
            <motivation>Replace softmax with linear kernel for O(n) complexity</motivation>
            <code>def forward(self, x): ...</code>

        Returns:
            {"name": "LinearAttention", "motivation": "...", "code": "..."}

        Raises:
            ValueError: if no valid tags found in response.
        """
        response = self.generate(prompt, system_prompt=system_prompt, call_name=call_name, **kwargs)
        content = response.content.strip()

        result: Dict[str, Any] = {}
        pos = 0

        while True:
            match = re.search(r"<(\w+)>", content[pos:])
            if not match:
                break
            tag_name = match.group(1)
            tag_start = pos + match.end()
            end_tag = f"</{tag_name}>"
            end_pos = content.find(end_tag, tag_start)
            if end_pos == -1:
                pos = tag_start
                continue
            result[tag_name] = content[tag_start:end_pos].strip()
            pos = end_pos + len(end_tag)

        if not result:
            logger.error(
                f"[LLM] extract_tags: no tags found in response "
                f"({len(content)} chars). Preview: {content[:500]}"
            )
            raise ValueError("No valid XML tags found in LLM response")

        return result
