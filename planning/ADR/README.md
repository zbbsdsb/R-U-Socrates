# Architecture Decision Records (ADRs)

> ADRs capture significant architectural decisions: the context that led to them, the decision itself, and its consequences. They are the project's institutional memory.

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | [SQLite for Development, PostgreSQL for Production](./ADR-001-sqlite-dev-postgres-prod.md) | Accepted | 2026-04-21 |
| ADR-002 | [Defer Sandboxing to Phase 3](./ADR-002-defer-sandbox.md) | Accepted | 2026-04-21 |
| ADR-003 | [Use LiteLLM Instead of Custom Model Adapters](./ADR-003-use-litellm.md) | Accepted | 2026-04-21 |

## When to Write an ADR

Write an ADR when a decision:
1. Affects more than one service or package
2. Has consequences that are difficult to reverse (e.g., database schema, API contracts)
3. Involves a tradeoff between competing concerns (performance vs. simplicity, cost vs. capability)
4. Is non-obvious — future maintainers will not understand why without explanation

## Format

Each ADR follows this structure:
- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
- **Context**: The situation that prompted this decision
- **Decision**: What was decided
- **Consequences**: What becomes easier or harder as a result
- **Alternatives Considered**: Options that were rejected and why
- **References**: Related documents or external resources

## Maintenance

ADRs are **append-only** in spirit — old decisions are deprecated or superseded, not deleted. This preserves the history of why the system is the way it is.
