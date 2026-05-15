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
from typing import Any, Dict, List, Optional, Tuple

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
    provider: str = ""


@dataclass
class ProviderConfig:
    model: str
    api_key: Optional[str] = None
    api_base: Optional[str] = None


# ---------------------------------------------------------------------------
# LiteLLM-backed client with fallback support
# ---------------------------------------------------------------------------

class LLMClient:
    """
    Thin LiteLLM wrapper with the same interface as ASI-Evolve's LLMClient,
    plus support for multiple providers with automatic fallback.

    Key features:
    - Accepts a list of ProviderConfig objects for fallback
    - Automatically tries next provider when one fails
    - Tracks current active provider
    """

    def __init__(
        self,
        providers: Optional[List[ProviderConfig]] = None,
        model: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        timeout: int = 120,
        retry_times: int = 3,
        retry_delay: int = 5,
    ):
        # Handle backward compatibility with old single-provider init
        if providers is None:
            providers = [ProviderConfig(model=model, api_key=api_key, api_base=api_base)]
        
        self.providers = providers
        self.current_provider_index = 0
        self.previous_provider_index = None  # Track previous provider index
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.retry_times = retry_times
        self.retry_delay = retry_delay

    @property
    def current_provider(self) -> ProviderConfig:
        return self.providers[self.current_provider_index]

    @property
    def current_model(self) -> str:
        return self.current_provider.model
    
    @property
    def current_provider_name(self) -> str:
        provider = self.current_provider
        return provider.model.split("/")[0] if "/" in provider.model else provider.model

    @property
    def switched_provider(self) -> bool:
        return self.previous_provider_index is not None and self.previous_provider_index != self.current_provider_index

    @property
    def previous_provider(self) -> Optional[ProviderConfig]:
        if self.previous_provider_index is not None:
            return self.providers[self.previous_provider_index]
        return None

    def chat(
        self,
        messages: List[Dict[str, str]],
        call_name: Optional[str] = None,
        **kwargs,
    ) -> LLMResponse:
        """Send a chat-completions request via LiteLLM with fallback support."""
        last_error: Optional[Exception] = None
        original_provider_index = self.current_provider_index
        self.previous_provider_index = self.current_provider_index  # Reset previous index

        # Try each provider in order
        for provider_index in range(original_provider_index, len(self.providers)):
            self.current_provider_index = provider_index
            provider = self.providers[provider_index]
            
            params = {
                "model": provider.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "timeout": self.timeout,
                **kwargs,
            }
            if provider.api_key:
                params["api_key"] = provider.api_key
            if provider.api_base:
                params["api_base"] = provider.api_base

            # Retry within a single provider
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

                    provider_name = provider.model.split("/")[0] if "/" in provider.model else provider.model
                    logger.debug(
                        f"[LLM] {call_name or 'call'} | provider={provider_name} | model={provider.model} "
                        f"| tokens={usage.get('total_tokens', '?')} | time={elapsed:.2f}s"
                    )

                    # If we switched providers, log that
                    if provider_index > original_provider_index:
                        logger.info(
                            f"[LLM] Successfully switched to fallback provider: {provider_name}"
                        )

                    return LLMResponse(
                        content=content,
                        usage=usage,
                        model=provider.model,
                        provider=provider_name,
                        call_time=elapsed,
                    )

                except Exception as exc:
                    last_error = exc
                    logger.warning(
                        f"[LLM] {call_name or 'call'} failed with provider {provider.model} "
                        f"(attempt {attempt + 1}/{self.retry_times}): {exc}"
                    )
                    if attempt < self.retry_times - 1:
                        time.sleep(self.retry_delay)
                    else:
                        logger.warning(
                            f"[LLM] All retries exhausted for provider {provider.model}, "
                            f"trying next provider..."
                        )

        # If we get here, all providers failed
        logger.error(f"[LLM] All providers failed! Last error: {last_error}")
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
