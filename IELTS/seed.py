"""
One-shot setup: creates tables, the 4 standard plans (60/90-day, solo + group) with a full
day-by-day task list, starter speaking topics, and YOUR teacher account.

    SEED_ADMIN_PASSWORD='choose-a-strong-one' python seed.py
    # optional: SEED_ADMIN_EMAIL=you@example.com  SEED_ADMIN_NAME="Ms. Kavitha"  SEED_KEEP_DEMO_STUDENT=true

Works against SQLite (default) or any DATABASE_URL (e.g. a free Supabase/Neon Postgres).
Safe to re-run. No passwords are hard-coded.
"""
import os
import secrets
import sys

admin_pw = os.environ.get('SEED_ADMIN_PASSWORD', '').strip()
if len(admin_pw) < 8:
    sys.exit('Set SEED_ADMIN_PASSWORD (min 8 chars), e.g.  SEED_ADMIN_PASSWORD=... python seed.py')

keep_demo_student = os.getenv('SEED_KEEP_DEMO_STUDENT', 'false').lower() == 'true'
# Re-use the app's built-in (development-only) seeding for plans + tasks, then tidy up.
os.environ.update({
    'FLASK_ENV': 'development',
    'SEED_DEMO_DATA': 'true',
    'REMOVE_SEEDED_DEMO_ACCOUNTS': 'false',
    'DEMO_TEACHER_PASSWORD': admin_pw,
    'DEMO_STUDENT_PASSWORD': os.getenv('DEMO_STUDENT_PASSWORD') or secrets.token_urlsafe(12),
})

from app import create_app  # noqa: E402
from models.db import db  # noqa: E402
from models.user import User  # noqa: E402
from models.plan import Plan  # noqa: E402
from utils.default_topics import seed_default_topics  # noqa: E402

app = create_app('development')
with app.app_context():
    email = os.getenv('SEED_ADMIN_EMAIL', 'teacher@ielts.com').strip().lower()
    name = os.getenv('SEED_ADMIN_NAME', 'Teacher').strip()
    demo_teacher = User.query.filter_by(email='teacher@ielts.com').first()
    existing = User.query.filter_by(email=email).first()
    if email != 'teacher@ielts.com':
        if existing and demo_teacher:
            db.session.delete(demo_teacher)          # re-run: drop the re-created placeholder
        elif demo_teacher:
            demo_teacher.email, demo_teacher.name = email, name
    teacher = User.query.filter_by(email=email).first()

    if not keep_demo_student:
        stu = User.query.filter_by(email='student@ielts.com').first()
        if stu:
            db.session.delete(stu)
    db.session.commit()

    n_topics = seed_default_topics(db, teacher.id) if teacher else 0
    print(f'Teacher login : {email}')
    print(f'Plans         : {Plan.query.count()}')
    print(f'Topics added  : {n_topics}')
    print('Done. Start the API with:  python app.py')
