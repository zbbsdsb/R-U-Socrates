# ADR-003: Use LiteLLM Instead of Custom Model Adapters

## Status
Accepted

## Context

The original MODULE_BREAKDOWN.md specifies implementing custom adapter classes for each model provider:
- `OpenAIAdapter`
- `DeepSeekAdapter`
- `ClaudeAdapter`
- `LocalModelAdapter`

Each adapter requires:
- Handling provider-specific authentication (API keys, headers, token management)
- Mapping provider-specific response schemas to a common internal format
- Implementing retry logic, rate limiting, and error handling per provider
- Keeping up with provider API changes (model deprecations, new parameters, response format changes)

Supporting 4+ providers naively means writing and maintaining ~400–600 lines of boilerplate adapter code, with ongoing maintenance burden.

LiteLLM (by BerriAI) provides a unified OpenAI-compatible API across 100+ LLM providers, including:
- OpenAI (GPT-4o, GPT-4 Turbo, etc.)
- Anthropic (Claude 3, Claude 3.5)
- DeepSeek
- Gemini
- Ollama (local models)
- vLLM
- Hugging Face inference endpoints
- And many more

LiteLLM handles all the boilerplate: authentication, retries, rate limits, cost tracking, and response normalization.

## Decision

Use **LiteLLM** as the model gateway's underlying runtime, wrapping it in a thin in-house `ModelGateway` class that:
- Provides our own configuration schema (model aliases, budget limits)
- Adds task-specific prompting wrappers
- Integrates with our internal observability (logging, metrics)

Do **not** implement custom adapters for OpenAI, Claude, DeepSeek, or any other provider directly.

The internal `ModelGateway` class exposes a single method:

```python
async def complete(
    self,
    prompt: str,
    model: str,  # our own alias, e.g. "researcher-gpt4o"
    **kwargs,
) -> str:
    # resolves alias → LiteLLM model string
    # enforces budget
    # logs token usage
    # returns raw response text
```

## Consequences

**Positive:**
- ~400–600 fewer lines of boilerplate code in Phase 1.
- Instant support for 100+ models with zero adapter code.
- LiteLLM is actively maintained; provider API changes are handled upstream.
- Built-in cost tracking and retries.
- Easy fallback: if provider A fails, try provider B automatically.

**Negative:**
- LiteLLM is an additional dependency (~2 MB). If LiteLLM has a bug or changes its API, we are blocked until an update is available.
- LiteLLM's error messages may be less precise than direct SDKs.
- Deployment adds one more service to track (LiteLLM's proxy mode adds a process; inline mode is simpler).

**Mitigation:**
- Use LiteLLM in **inline mode** (not proxy mode) — it makes direct API calls without a separate proxy process.
- Pin LiteLLM version in `requirements.txt` with `~=` (compatible release).
- Write a thin abstraction layer (`services/model-gateway/gateway.py`) so that replacing LiteLLM requires changing only one file.

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| Custom adapters per provider | ~400–600 lines of boilerplate; ongoing maintenance burden; risk of API drift |
| LangChain / LangSmith | Over-engineered for our use case; adds significant cognitive overhead; harder to debug |
| Direct SDK per provider | Same as custom adapters with vendor SDK overhead |
| Anthropic SDK + OpenAI SDK only | Limits to two providers; harder to add new models |

## References

- LiteLLM documentation: https://docs.litellm.ai/
- `planning/MODULE_BREAKDOWN.md` §2.4 (original ModelGateway adapter design)
- LiteLLM supported providers: https://docs.litellm.ai/docs/providers
