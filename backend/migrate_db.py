"""
migrate_db.py — Safe schema migration script.

Run ONCE after deploying the updated code to add new columns to existing tables.
The script is idempotent: re-running it is safe (it checks before adding).

Usage:
    python migrate_db.py
"""
import sys
from sqlalchemy import text, inspect

try:
    from app import create_app, db
    from utils.schema import ensure_user_schema_columns
    app = create_app()
except ImportError:
    from app import app
    from models.db import db
    from utils.schema import ensure_user_schema_columns


def column_exists(conn, table, column):
    insp = inspect(conn)
    cols = [c['name'] for c in insp.get_columns(table)]
    return column in cols


MIGRATION_VERSION = '2026-09-15-ielts-production-foundation'


def run_migration():
    with app.app_context():
        conn = db.engine.connect()
        try:
            migrations = []
            is_pg = 'postgresql' in str(db.engine.url)

            # This is the only production bootstrap path. The WSGI app keeps
            # schema mutation disabled, while this command creates any missing
            # baseline tables before applying additive migrations.
            db.create_all()
            ensure_user_schema_columns(db)
            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS schema_migrations ("
                "version VARCHAR(120) PRIMARY KEY, "
                "applied_at TIMESTAMP NOT NULL)"
            ))

            # ── users table ──────────────────────────────────────────
            if not column_exists(conn, 'users', 'teacher_id'):
                conn.execute(text("ALTER TABLE users ADD COLUMN teacher_id INTEGER REFERENCES users(id)"))
                migrations.append("users.teacher_id")

            for col in ('listening_band', 'reading_band', 'writing_band', 'speaking_band'):
                if not column_exists(conn, 'users', col):
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} FLOAT"))
                    migrations.append(f"users.{col}")

            # ── student_plans table ────────────────────────────────
            for col, sql_type in (
                ('due_date', 'DATE'),
                ('reminder_days', 'INTEGER DEFAULT 3'),
                ('reminder_sent_at', 'TIMESTAMP'),
            ):
                if not column_exists(conn, 'student_plans', col):
                    conn.execute(
                        text(
                            f"ALTER TABLE student_plans ADD COLUMN "
                            f"{col} {sql_type}"
                        )
                    )
                    migrations.append(f"student_plans.{col}")

            # ── submissions table ─────────────────────────────────────
            if not column_exists(conn, 'submissions', 'band_score'):
                conn.execute(text("ALTER TABLE submissions ADD COLUMN band_score FLOAT"))
                migrations.append("submissions.band_score")

            # Make task_id nullable (PostgreSQL only – SQLite doesn't support ALTER COLUMN)
            if is_pg:
                conn.execute(text("ALTER TABLE submissions ALTER COLUMN task_id DROP NOT NULL"))
                migrations.append("submissions.task_id -> nullable")

            conn.commit()

            already_applied = conn.execute(
                text(
                    "SELECT 1 FROM schema_migrations "
                    "WHERE version = :version"
                ),
                {'version': MIGRATION_VERSION},
            ).first()
            if not already_applied:
                conn.execute(
                    text(
                        "INSERT INTO schema_migrations (version, applied_at) "
                        "VALUES (:version, CURRENT_TIMESTAMP)"
                    ),
                    {'version': MIGRATION_VERSION},
                )
                conn.commit()
                migrations.append(MIGRATION_VERSION)

            if migrations:
                print("✅ Migration complete. Added:", ", ".join(migrations))
            else:
                print("✅ Schema already up to date – nothing to do.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Migration failed: {e}")
            sys.exit(1)
        finally:
            conn.close()


if __name__ == '__main__':
    run_migration()
