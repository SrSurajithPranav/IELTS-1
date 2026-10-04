#!/usr/bin/env python3
"""Create the local demo accounts used to exercise every application role.

Passwords are read from environment variables so they are never committed to
the repository. Existing accounts are left unchanged, making this script
safe to run repeatedly.

Example:
    SEED_ADMIN_PASSWORD='change-me' \
    SEED_TEACHER_PASSWORD='change-me' \
    SEED_STUDENT_PASSWORD='change-me' \
    python scripts/seed_users.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from models.db import db
from models.user import User
from werkzeug.security import generate_password_hash


def _password(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f'{name} is required. Set it to a local password before seeding.'
        )
    return value


ADMINS = (
    ('Super Admin', 'admin@test.com'),
    ('Operations Admin', 'admin2@test.com'),
)
TEACHERS = (
    ('Teacher One', 'teacher1@test.com'),
    ('Teacher Two', 'teacher2@test.com'),
)
STUDENTS = (
    ('Student One', 'student1@test.com'),
    ('Student Two', 'student2@test.com'),
    ('Student Three', 'student3@test.com'),
    ('Student Four', 'student4@test.com'),
)


def create_user(name, email, password, role, teacher_id=None):
    """Create one account if it does not already exist."""
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f'Skipping existing: {email}')
        return existing

    user = User(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role=role,
        teacher_id=teacher_id,
    )
    db.session.add(user)
    db.session.flush()
    print(f'Created {role}: {email}')
    return user


def main():
    admin_password = _password('SEED_ADMIN_PASSWORD')
    teacher_password = _password('SEED_TEACHER_PASSWORD')
    student_password = _password('SEED_STUDENT_PASSWORD')

    app = create_app('development')
    with app.app_context():
        db.create_all()

        for name, email in ADMINS:
            create_user(name, email, admin_password, 'admin')

        teachers = [
            create_user(name, email, teacher_password, 'teacher')
            for name, email in TEACHERS
        ]
        db.session.commit()

        for index, (name, email) in enumerate(STUDENTS):
            teacher = teachers[index % len(teachers)]
            student = create_user(
                name,
                email,
                student_password,
                'student',
                teacher_id=teacher.id,
            )
            if student.teacher_id != teacher.id:
                student.teacher_id = teacher.id
        db.session.commit()

        print(
            'Seeded totals: '
            f'admins={User.query.filter_by(role="admin").count()}, '
            f'teachers={User.query.filter_by(role="teacher").count()}, '
            f'students={User.query.filter_by(role="student").count()}'
        )


if __name__ == '__main__':
    main()
