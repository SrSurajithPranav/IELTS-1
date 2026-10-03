from sqlalchemy import inspect, text


def ensure_user_schema_columns(db):
    """Add missing user columns for older databases without crashing startup."""
    try:
        inspector = inspect(db.engine)
        if 'users' not in inspector.get_table_names():
            return

        user_columns = {column['name'] for column in inspector.get_columns('users')}
        column_sql = {
            'teacher_id': 'INTEGER',
            'listening_band': 'FLOAT',
            'reading_band': 'FLOAT',
            'writing_band': 'FLOAT',
            'speaking_band': 'FLOAT',
            'last_active_date': 'DATE',
            'weak_areas': "VARCHAR(500) DEFAULT ''",
            'zoom_link': 'VARCHAR(500)',
            'created_at': 'TIMESTAMP',
        }

        for column_name, column_type in column_sql.items():
            if column_name not in user_columns:
                db.session.execute(text(f'ALTER TABLE users ADD COLUMN {column_name} {column_type}'))

        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def ensure_columns(db, table, column_sql):
    """Add missing columns to an existing table (SQLite/PostgreSQL safe, idempotent)."""
    try:
        inspector = inspect(db.engine)
        if table not in inspector.get_table_names():
            return
        existing = {c['name'] for c in inspector.get_columns(table)}
        for name, ddl in column_sql.items():
            if name not in existing:
                db.session.execute(text(f'ALTER TABLE {table} ADD COLUMN {name} {ddl}'))
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
