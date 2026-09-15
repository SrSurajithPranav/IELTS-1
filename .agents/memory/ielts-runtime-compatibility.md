---
name: IELTS runtime compatibility
description: Python and PostgreSQL driver compatibility for the IELTS project.
---

Use `psycopg2-binary` 2.9.10 or newer with Python 3.13.

**Why:** Older 2.9.9 wheels are unavailable for this runtime and the installer falls back to a source build that requires `pg_config`.

**How to apply:** Keep the backend requirement unpinned to 2.9.9 or newer, and verify the import before running Flask or database migrations.