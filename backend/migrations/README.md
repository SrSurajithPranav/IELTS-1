# IELTS database migrations

Production does not mutate the schema when Gunicorn imports the Flask app.
`Procfile` runs `python migrate_db.py` first, and that command is the single
schema bootstrap/upgrade entrypoint.

The runner is idempotent and records the foundation migration in
`schema_migrations`. It creates missing baseline tables from the SQLAlchemy
models, then applies additive compatibility changes for older databases:

- user ownership and per-skill band columns
- nullable practice submissions and teacher band scores
- plan due-date and reminder fields

Run it with the production environment loaded:

```bash
FLASK_ENV=production python migrate_db.py
```

`DATABASE_URL` must point to PostgreSQL in production. Local development and
tests may use SQLite through the `development` and `testing` configurations.