# ADR-002: Defer Sandboxing to Phase 3

## Status
Accepted

## Context

The original TECHNICAL_IMPLEMENTATION.md specifies Docker/gVisor-based sandboxing for code execution as part of the core Engineer module.

Sandboxing is a hard problem. Implementing it correctly requires:
- Docker-in-Docker or rootless Docker configuration
- Resource limits (CPU, memory, network, disk I/O)
- Timeout enforcement at the container level
- Escape prevention and syscall filtering
- Container image management and security updates

For a Phase 1 MVP:
- The primary user is the developer (the same person running the code).
- All prompts and tasks are self-authored — there is no untrusted external input.
- The execution environment is a controlled local machine.

Running arbitrary code without sandboxing on a developer's own machine is acceptable risk at this stage.

## Decision

**No sandbox in Phase 1–2.** Code execution is done via direct `subprocess.run()` with:

- **Timeout**: hard limit per execution step (configurable, default 60s)
- **Resource limits**: `resource` module (ulimit equivalent on Linux/macOS); on Windows, a watchdog thread monitors memory and CPU
- **No network access**: `http://`, `https://`, socket calls blocked via monkey-patching at module import time
- **Working directory isolation**: each run gets an isolated temp directory that is deleted after completion
- **Output capture**: stdout/stderr captured, max 1 MB

Phase 3 adopts Docker-based sandboxing when one of the following triggers:
- Untrusted user-submitted code in production
- Explicit multi-tenant deployment
- Community deployment (third parties running their own instances)

## Consequences

**Positive:**
- Engineer module can be implemented in ~100 lines of Python instead of ~500.
- No Docker daemon dependency for development.
- Faster iteration — execution is subprocess-local, no container startup overhead.
- Debugging is straightforward: print statements work, pdb works.

**Negative:**
- A malicious input prompt could execute destructive commands on the host. **Not a risk in Phase 1** (developer is the only user).
- CPU/memory exhaustion is possible. Monitored by watchdog but not hard-limited on Windows.
- No true network isolation.

**Security posture for Phase 1:**
- Execute only in development environment.
- Code generation is handled by the same LLM that the developer controls.
- Document the risk explicitly; do not claim production-grade security.

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| gVisor | Complex kernel-level setup; significant engineering cost for MVP |
| WebAssembly (WASM) sandbox | Excellent isolation but requires adapting all Python evaluation scripts to WASM; too much overhead |
| AWS Lambda as execution backend | Introduces cloud dependency and cost; removes local-first capability |
| E2B / Modal | Third-party SaaS; adds external dependency and cost |

## References

- `planning/MODULE_BREAKDOWN.md` §4.5 (Sandbox Manager module spec)
- `planning/TECHNICAL_ARCHITECTURE.md` §2.3.3 (sandbox design)
