# IELTS Training Platform

An IELTS preparation platform with student, teacher, and admin workflows for plans, tasks, submissions, feedback, and practice diagnostics.

## Run & Operate

- The main app lives in `IELTS/`.
- The `IELTS Training Platform` workflow starts Flask on port 5000 and Vite on port 5173.
- `cd IELTS && npm run dev` — run the frontend only.
- `cd IELTS && npm run build` — build the frontend.
- `cd IELTS && python app.py` — run the Flask API.
- `cd IELTS && python -m unittest discover -s tests -p 'test*.py' -v` — run backend tests.
- `cd IELTS && python -m py_compile app.py config.py migrate_db.py routes/*.py utils/*.py models/*.py` — compile-check backend Python files.
- Required production env: `DATABASE_URL`, `JWT_SECRET_KEY`, and configured CORS origins.

## Stack

- Frontend: React 18, Vite, React Router, Recharts, Socket.IO client
- API: Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO
- Database: PostgreSQL via SQLAlchemy and psycopg2
- Deployment targets: Supabase PostgreSQL, Render Gunicorn backend, Vercel frontend

## Where things live

- `IELTS/app.py` — Flask application factory and startup initialization
- `IELTS/config.py` — environment-backed configuration and production validation
- `IELTS/routes/` — API route blueprints
- `IELTS/models/` — SQLAlchemy models
- `IELTS/src/` — React frontend
- `IELTS/FEATURE_STATUS.md` — current feature completeness and known limitations
- `IELTS/REPOSITORY_AUDIT.md` — architecture and persistence audit
- `IELTS/requirements.txt` — backend dependency source of truth
- `IELTS/package.json` — frontend dependency source of truth

## Architecture decisions

- Existing Flask/React architecture is preserved; deployment work is incremental rather than a rewrite.
- PostgreSQL is required for production persistence; local disk is not a production storage fallback.
- IELTS band scores are only shown when supplied by teacher-reviewed data. Transcript and language checks are practice diagnostics, not official scoring.
- Production audio uploads require configured Cloudinary storage.

## Product

Students can authenticate, follow study plans, complete reading/listening/writing/speaking tasks, submit work, and review feedback. Teachers and admins can manage students, plans, tasks, and reviews.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `IELTS/migrate_db.py` before Gunicorn in production so existing PostgreSQL databases receive required columns.
- Do not enable demo seed data in production.
- Python 3.13 requires `psycopg2-binary` 2.9.10 or newer.
- The current heuristic practice checks must not be presented as official IELTS band evaluation.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
