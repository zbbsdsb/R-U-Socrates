# ADR-006: MVP Evaluator — User-Defined Score + Execution Fallback

## Status
Accepted

## Context

The `Pipeline` requires a scoring signal to drive the evolutionary loop. Without a meaningful score, the loop has no selection pressure — `best_score` stays at 0.0 and the researcher cannot improve over iterations.

The `Engineer` is responsible for evaluation. It needs an `eval_script` to run against the generated candidate code. The upstream ASI-Evolve left this as an external dependency (the user provides a shell script). For the R U Socrates MVP, we need something self-contained that works out of the box.

**Design constraints**:
1. Must work without any external evaluator script provided by the user
2. Must allow power users to define their own task-specific scoring logic
3. Score must be in `[0.0, 1.0]` for consistent comparison
4. Phase 1: no sandbox — evaluation runs in the same Python process (ADR-002)

## Decision

`services/worker/evaluator.py` is a self-contained CLI that is invoked by `Engineer.run()`.

**Scoring hierarchy** (in order of priority):

| Priority | Method | Trigger | Score range |
|----------|--------|---------|-------------|
| 1 | `user_defined_score()` | Candidate defines this function | `[0.0, 1.0]` |
| 2 | `score()` | Candidate defines this function | `[0.0, 1.0]` |
| 3 | Execution scoring | No user-defined score | `[0.5, 1.0]` |
| 4 | Import scoring | No `run()` function | `[0.5]` |

**Execution scoring breakdown**:
- Runs without error → +0.5 base
- Completes in <1s → +0.3 time bonus
- Each passing `test_*` function → +0.1 (cap: 0.2)
- Max total: 1.0

**Researcher prompt instructs candidates to define `user_defined_score()`** when the task has a quantifiable objective (e.g., accuracy, runtime, compression ratio). This creates a natural evolutionary pressure toward better solutions.

## Consequences

### What becomes easier
- The loop produces meaningful scores from iteration 1 — no manual scorer needed to see progress
- Power users can define arbitrary scoring logic without modifying pipeline code
- The evaluator is a plain Python script — trivially replaceable

### What becomes harder
- **Security**: code runs in-process. Malicious candidates can execute arbitrary Python. This is acceptable for Phase 1 (single-user local dev) and explicitly deferred to Phase 2 sandboxing (ADR-002).
- **Scoring quality**: execution-based fallback rewards speed and test-passing, not correctness. A candidate that defines `user_defined_score()` returning 1.0 unconditionally will "win" — this is a known limitation, not a bug.

### Phase 2 upgrade path
- Replace in-process `importlib` with Docker sandbox (per ADR-002)
- Add richer test harness support (pytest integration, fixture injection)
- Add reference implementation comparison for scientific benchmarks

## Alternatives Considered

**Alternative A: Require user to provide `eval_script` always**
- Rejected: breaks "works out of the box" principle. User must set up an evaluator before seeing any result.

**Alternative B: Always use execution scoring, no `user_defined_score()`**
- Rejected: most research tasks don't have a single "time to finish" metric. We need the ability to express task-specific objectives.

**Alternative C: LLM-as-judge scoring**
- Rejected for MVP: adds latency, cost, and inconsistency. The LLM judge is Phase 3 territory.
