# ADR-001: Use SQLite for Development, PostgreSQL for Production

## Status
Accepted

## Context

The original TECHNICAL_IMPLEMENTATION.md specifies PostgreSQL 15+ as the primary database from day one, requiring a running Docker container in the development environment.

This creates a bootstrapping problem:
- A developer who wants to explore the codebase must install and configure Docker, PostgreSQL, and Redis before writing a single line of code.
- The friction is high enough to discourage experimentation.
- For a Phase 1 MVP where the team is a single developer, PostgreSQL concurrency capabilities are irrelevant — there is only one writer.

Additionally, the schema is not yet stable. The data models (Task, Run, Result, Template) are defined in planning documents but have not been validated against real workload patterns. Running migrations on SQLite is simpler and faster for rapid iteration.

## Decision

Use **SQLite** as the development database (Phase 1–2).

- SQLAlchemy 2.0 is the ORM interface for all database operations.
- All SQL is written using SQLAlchemy's dialect-agnostic patterns — no raw SQL.
- Switching from SQLite → PostgreSQL requires changing exactly one environment variable (`DATABASE_URL`) and verifying that the SQLAlchemy migration tooling works correctly with the target dialect.
- Alembic is used for schema migrations so that the migration history is dialect-aware.

PostgreSQL is adopted in Phase 3, triggered by one of:
- Multi-user write concurrency observed in testing
- Explicit production deployment requirement

## Consequences

**Positive:**
- Developer can run `uv run fastapi dev` with no external dependencies beyond the Python venv.
- Schema migrations are fast (SQLite file-based, no connection overhead).
- Zero infrastructure cost for local development.

**Negative:**
- SQLite does not support true concurrent writes. In multi-worker deployments (Phase 3), writes will block. Acceptable for MVP single-user / single-worker.
- Some SQLAlchemy features (e.g., advisory locks) are not portable.
- Slight risk of dialect leakage if raw SQL snippets are introduced — mitigated by strict code review.

**Mitigation:**
- Enforce dialect-agnostic SQLAlchemy patterns via linter rule.
- Document the switch procedure in `planning/reports/sqlite-to-postgres.md` when Phase 3 is triggered.

## Alternatives Considered

| Option | Reason Rejected |
|--------|----------------|
| PostgreSQL from day 1 | Too much friction for single-developer Phase 1 |
| MongoDB | Schema-less design hides data model instability rather than fixing it |
| JSON file storage | No query capability; not suitable for Task/Run/Result relational model |

## References

- `planning/TECHNICAL_IMPLEMENTATION.md` §5.1 (original Docker Compose spec using PostgreSQL)
- SQLAlchemy 2.0 multi-dialect support
