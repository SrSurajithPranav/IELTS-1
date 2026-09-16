import os
from datetime import timedelta


def normalize_database_url(value):
    """Normalize common Postgres connection string variants for deployment."""
    db_url = (value or "").strip()
    if not db_url:
        return "sqlite:///ielts.db"

    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)

    if ('supabase.co' in db_url or 'pooler.supabase.com' in db_url) and 'sslmode=' not in db_url:
        separator = '&' if '?' in db_url else '?'
        db_url = f'{db_url}{separator}sslmode=require'

    return db_url


def configured_origins():
    """Return the explicit browser origins allowed to call the API."""
    raw = os.getenv('CORS_ALLOWED_ORIGINS') or os.getenv('FRONTEND_BASE_URL', '')
    return [
        origin.strip().rstrip('/')
        for origin in raw.split(',')
        if origin.strip()
    ]


class Config:
    """Base configuration."""
    SQLALCHEMY_DATABASE_URI = normalize_database_url(os.getenv('DATABASE_URL', 'sqlite:///ielts.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_ALLOWED_ORIGINS = configured_origins()
    SEED_DEMO_DATA = os.getenv('SEED_DEMO_DATA', 'false').lower() == 'true'
    # The application may bootstrap a local/test database, but production
    # schema changes are applied by migrate_db.py before the WSGI server starts.
    SCHEMA_AUTO_CREATE = True
    RUN_SCHEMA_MIGRATIONS_ON_STARTUP = True
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

    # Login approval + email notifications
    # Default OFF — easier developer experience and Codespaces testing
    REQUIRE_LOGIN_APPROVAL = os.getenv('REQUIRE_LOGIN_APPROVAL', 'false').lower() == 'true'
    ADMIN_APPROVER_EMAIL = os.getenv('ADMIN_APPROVER_EMAIL')
    FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173')
    BACKEND_BASE_URL = os.getenv('BACKEND_BASE_URL', 'http://localhost:5000')

    SMTP_HOST = os.getenv('SMTP_HOST')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER')
    SMTP_PASS = os.getenv('SMTP_PASS')
    SMTP_FROM = os.getenv('SMTP_FROM', os.getenv('SMTP_USER', 'no-reply@ielts.local'))

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    REQUIRE_LOGIN_APPROVAL = False

class ProductionConfig(Config):
    """Production configuration — requires DATABASE_URL env var (PostgreSQL)."""
    DEBUG = False
    REQUIRE_LOGIN_APPROVAL = False
    SEED_DEMO_DATA = False
    SCHEMA_AUTO_CREATE = False
    RUN_SCHEMA_MIGRATIONS_ON_STARTUP = False

    @classmethod
    def init_app(cls, app):
        """Validate that critical env vars are set in production."""
        db_url = normalize_database_url(os.getenv('DATABASE_URL', ''))
        if not db_url or 'sqlite' in db_url:
            raise RuntimeError(
                "Production requires DATABASE_URL to point to PostgreSQL; "
                "SQLite is only supported for local development."
            )
        if not os.getenv('JWT_SECRET_KEY'):
            raise RuntimeError(
                "Production requires JWT_SECRET_KEY to be configured."
            )
        if not os.getenv('CORS_ALLOWED_ORIGINS') and not os.getenv('FRONTEND_BASE_URL'):
            raise RuntimeError(
                "Production requires CORS_ALLOWED_ORIGINS or FRONTEND_BASE_URL."
            )

        app.config['SQLALCHEMY_DATABASE_URI'] = db_url

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
