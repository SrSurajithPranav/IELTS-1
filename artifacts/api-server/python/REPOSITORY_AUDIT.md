# Repository audit

## Scope

- Repository: `https://github.com/SrSurajithPranav/IELTS`
- Baseline inspected: `main` at `48f66a11aea493c2e89141ac3f48cad90053bb58`
- Architecture found: React/Vite frontend, Flask/SQLAlchemy backend, JWT auth, SQLite fallback/PostgreSQL option, Cloudinary option, Render/Vercel deployment files.

## File/component → feature → API → database → integration → status

| File/component | Feature | Backend/API | Database | Frontend integration | Current status |
| --- | --- | --- | --- | --- | --- |
| `src/contexts/AuthContext.jsx`, `routes/auth.py`, `models/user.py` | Registration/login/session | `/api/auth/register`, `/login`, `/refresh`, `/me` | `users` | App login and profile restoration | Partial; no revocation/rotation and no automated role/expiry coverage |
| `src/services/api.js` | Shared API transport | All REST blueprints | N/A | Most current pages | Partial; legacy `NewPages.jsx` had a duplicate client and several widgets used the wrong token key; first pass consolidated them |
| `app.py`, `config.py`, `Procfile`, `vercel.json` | Deployment foundation | `/api/health` | `db.create_all()` plus ad-hoc startup alterations | Vite build and proxy | Partial; production validation/CORS improved, but migrations and environment-backed routing remain |
| `src/pages/student/Plans.jsx`, `routes/plans.py`, `models/plan.py`, `models/student_plan.py` | Plans and assignments | `/api/plans/*` | `plans`, `student_plans`, `tasks` | Student/admin plan views | Partial; reminders route was unreachable and is repaired; content/progress model remains incomplete |
| `src/pages/student/Writing.jsx`, `routes/ai.py`, `routes/submissions.py` | Writing practice | `/api/ai/writing/*`, `/api/submissions/*` | `submissions` | Writing editor/history | Partial; deterministic helpers exist, but no real four-criterion evaluator or draft persistence |
| `src/pages/student/Speaking.jsx`, `routes/ai.py`, `routes/speaking.py` | Speaking practice | `/api/ai/speaking/*`, `/api/speaking/*` | No dedicated speaking-attempt model | Transcript and history UI | Partial; browser transcript works where supported, pronunciation/audio evaluation is not real |
| `src/components/reading/*`, `routes/reading.py` | Reading tools | `/api/reading/*` | None | Components were wired to incorrect auth/token paths | Placeholder; data is hardcoded and the widgets are now routed through the shared client |
| `src/components/listening/*`, `routes/listening.py` | Listening tools | `/api/listening/*` | None | Components were wired to incorrect auth/token paths | Placeholder; no real audio/test persistence |
| `src/pages/student/MockTest.jsx` | Mock exam | Writing/speaking AI endpoints only | Standalone submissions only | Local timer and static content | Placeholder; missing full exam state/result model |
| `models/*.py`, `migrate_db.py`, `utils/schema.py` | Persistence | N/A | SQLAlchemy models | Backend routes | Partial; no Alembic/Flask-Migrate migration history and multiple requested domain models are absent |
| `tests/*` | Verification | Schema helper + question bank utility | Mocked schema test | Node test runner | Not ready; Python dependencies were unavailable and integration coverage is minimal |

## Highest-priority blockers

1. Replace startup `create_all()`/manual `ALTER TABLE` behavior with versioned migrations.
2. Remove heuristic band scores/rewrite claims and add a real server-side AI provider with validated structured output, or present an explicit unavailable state.
3. Build persistent reading/listening test content and attempt models before advertising full tests.
4. Enforce one API/auth source of truth and add role/ownership integration tests.
5. Move production media off local disk and verify Cloudinary failure handling.
6. Add dependency installation and repeatable backend tests to CI.

This file is an audit record, not a claim that the platform is production-ready.