# ADR-005: SQLite as the Long-Term Storage Architecture

**Date**: 2026-04-22  
**Status**: Accepted  
**Supersedes**: ADR-001 (which framed SQLite as a Phase 1 compromise pending PostgreSQL migration)

---

## Context

ADR-001 treated SQLite as a temporary development convenience, with PostgreSQL as the "real" target for Phase 3. This framing created a latent assumption that the codebase needs to be written for future migration, adding mental overhead and planning debt.

That assumption is wrong for this product.

---

## Decision

**SQLite is the correct long-term storage choice for R U Socrates, not a temporary compromise.**

ADR-001 is superseded. There is no planned migration to PostgreSQL unless a specific, concrete trigger occurs (see below).

---

## Reasoning

### 1. The product is personal, not multi-tenant

R U Socrates is a research tool for one researcher. A SQLite database can handle thousands of research tasks, millions of result rows, and gigabytes of stored nodes without any performance issue. The constraint of SQLite (concurrent write throughput) is irrelevant when there is one writer.

### 2. SQLite is not "small database" — it is the right database

SQLite is:
- Used by Obsidian, Notion desktop, Linear (local mode), Signal, WhatsApp
- The most deployed database engine in the world
- Fully ACID compliant, with WAL mode supporting concurrent reads
- A single portable file — trivially backable up, version-controlled, inspectable

The only reason to use PostgreSQL is: multiple simultaneous writers at scale. That is not this product.

### 3. The file is the product

A SQLite file containing a user's complete research history — every task, every run, every node explored, every Analyzer interpretation — is itself a valuable artifact. It can be:
- Opened in any SQLite viewer (DB Browser for SQLite, Beekeeper Studio)
- Version-controlled with git-lfs or Litestream
- Shared with collaborators by copying one file
- Synced to S3/R2 via Litestream for backup without changing the application

### 4. SQLAlchemy abstraction is already sufficient

All database access goes through SQLAlchemy ORM. If PostgreSQL is ever needed, the migration is:

```python
# Change one line in config:
DATABASE_URL = "sqlite:///./data/rus.db"
# → becomes:
DATABASE_URL = "postgresql://user:pass@host/db"
```

And run `alembic upgrade head`. That is the entire migration cost.

---

## Configuration

```python
# services/api/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/rus.db")

# Enable WAL mode for SQLite (concurrent reads while writing)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

# WAL mode pragma for SQLite
if "sqlite" in DATABASE_URL:
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("PRAGMA synchronous=NORMAL"))
```

---

## Trigger for PostgreSQL

PostgreSQL will be introduced **only** if ALL of the following are true simultaneously:
1. The product has more than one concurrent active user
2. Write contention is measurably causing failures (not theoretically)
3. The team has bandwidth to operate a PostgreSQL server

Until all three are true, SQLite is the correct choice.

---

## Consequences

**Positive**:
- Zero infrastructure: no database server to install, configure, or maintain
- Development, production, and testing use the same database engine
- The research history is a portable file the user owns
- Backup is `cp rus.db rus.backup.db`

**Negative**:
- Cannot support multi-user write concurrency without migration
- Some advanced PostgreSQL features (e.g., `LISTEN/NOTIFY`, partial indexes on expressions) unavailable

**Accepted**: These limitations do not apply to the current product definition.

---

## References

- [Consider SQLite](https://blog.wesleyac.com/posts/consider-sqlite) — Wesley Aptekar-Cassels
- [I'm All-In on Server-Side SQLite](https://fly.io/blog/all-in-on-sqlite-litestream/) — Fly.io
- [Litestream](https://litestream.io/) — streaming replication of SQLite to S3
