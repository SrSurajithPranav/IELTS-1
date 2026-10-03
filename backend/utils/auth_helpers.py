from flask_jwt_extended import get_jwt_identity
from models.user import User


def current_user():
    try:
        return User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def is_staff(user):
    return bool(user and user.role in ('admin', 'teacher'))


def local_now():
    """Return school-local naive time for slot and session records."""
    import os
    from datetime import datetime, timedelta

    try:
        offset = int(os.getenv('APP_TZ_OFFSET_MINUTES', '330'))
    except ValueError:
        offset = 330
    return datetime.utcnow() + timedelta(minutes=offset)