# IELTS platform feature status

This is the verified baseline for commit `48f66a11aea493c2e89141ac3f48cad90053bb58`.
Statuses describe the implementation in source code, not the presence of a page or route.

| Area | Status | Evidence and missing verification |
| --- | --- | --- |
| Frontend build | 🟡 PARTIALLY WORKING | `npm run build` passes. The main bundle is about 5.5 MB minified and Vite reports a chunk-size warning; route-level code splitting is not implemented. |
| Backend startup | 🟡 PARTIALLY WORKING | Flask app factory, Gunicorn entrypoint, and `/api/health` exist. Production now rejects missing PostgreSQL/JWT configuration. A migration system is still missing; startup still calls `db.create_all()` and ad-hoc schema updates. |
| Authentication | 🟡 PARTIALLY WORKING | Register/login/refresh/profile routes and JWT protection exist. Refresh-token persistence and password validation were repaired. Logout is client-side only, and token revocation/rotation and an automated auth test suite are still missing. |
| Roles and access control | 🟡 PARTIALLY WORKING | Admin/teacher/student checks exist in many routes. Teacher ownership checks are inconsistent across management routes, and the full role matrix is not covered by tests. |
| Training plans/tasks | 🟡 PARTIALLY WORKING | Plans, tasks, assignments, progress-day helpers, and task submission routes exist. Generated tasks are templates rather than a complete content-backed IELTS curriculum; progress/completion persistence is incomplete. |
| Writing | 🟡 PARTIALLY WORKING | The editor, word count, prompts, submission history, and deterministic structure/cohesion/cliché tools exist. Draft autosave, timer persistence, four-criterion evaluation, corrections, and evidence-backed band scoring are not complete. |
| Writing AI | 🔴 DUMMY / PLACEHOLDER | `routes/ai.py` uses heuristic scoring and a rule-based rewrite while presenting band estimates. It is not a production IELTS evaluator and must be replaced or clearly labeled as a non-band language check before being advertised. |
| Speaking | 🟡 PARTIALLY WORKING | Browser speech recognition, transcript input, prompts, and history UI exist. Audio is not reliably analyzed server-side; pronunciation is currently fabricated when only a transcript is available, and speaking attempts are not modeled separately. |
| Reading | 🔴 DUMMY / PLACEHOLDER | Helper drills are hardcoded in `routes/reading.py`; there is no persistent 40-question test/session model, automatic IELTS conversion, question-level history, or evidence-backed mistake analysis. |
| Listening | 🔴 DUMMY / PLACEHOLDER | Dictation/NG drills and section metadata are hardcoded. There is no real audio-backed four-section test, 40-question scoring, transcript comparison, or production media lifecycle. |
| Vocabulary/mistakes | 🟡 PARTIALLY WORKING | Vocabulary and mistake tables/routes exist. The frontend also keeps a separate localStorage mistake counter, so there are two sources of truth and no verified mastery/drill loop. |
| Analytics/dashboard | 🟡 PARTIALLY WORKING | Several dashboard views read submissions and user fields. Some views still use review percentages rather than real per-skill band progression; insufficient-data states and chart persistence are incomplete. |
| Mock exam | 🔴 DUMMY / PLACEHOLDER | The current mock page contains static prompts and a local timer. It is not the required Listening → Reading → Writing → Speaking persisted exam flow. |
| AI debate | 🟡 PARTIALLY WORKING | A rule-based practice analyzer exists and is explicitly separate from official IELTS, but it is not an AI debate/interview loop. The missing `re` import was repaired. |
| Notifications/live sessions | 🟡 PARTIALLY WORKING | Notification routes, SSE, Socket.IO, Jitsi links, and recordings metadata exist. Storage, authorization coverage, and production worker behavior need verification. |
| Production storage | 🔴 DUMMY / PLACEHOLDER | Cloudinary integration exists, but uploads fall back to local disk, which is ephemeral on Render. PostgreSQL is required for production; migrations and persistent media policy remain unfinished. |
| Testing | 🟡 PARTIALLY WORKING | The question-bank Node test and the schema Python unittest pass after installing dependencies. Route/auth/persistence/build integration coverage is still absent. |

## Phase 1 fixes in this baseline

- Removed the committed credential artifact.
- Disabled predictable demo-account seeding unless local development explicitly sets `SEED_DEMO_DATA=true` and supplies demo passwords.
- Added production validation for PostgreSQL and `JWT_SECRET_KEY`.
- Replaced wildcard API/Socket.IO CORS with configured origins.
- Repaired the unreachable plan-reminder route caused by indentation.
- Normalized registration email/password validation and made `/api/auth/me` return `401` for a deleted user.
- Persisted the refresh token in the auth context.
- Routed standalone reading, listening, speaking, and writing widgets through the shared authenticated API client; corrected their `/api/ai/...` paths.
- Fixed the missing `submissionsAPI` import in the mock-test page.
- Removed the hardcoded Render fallback from the frontend API client and Vercel rewrites; cross-origin deployments now require `VITE_API_URL`.
- Updated the SQLAlchemy requirement to `>=2.0.36` so the backend test suite imports on Python 3.13.

## Verification commands

```text
npm ci --ignore-scripts
npm run build                         PASS
node --test tests/questionBank.test.mjs  PASS
python -m py_compile app.py config.py routes/*.py models/*.py utils/*.py  PASS
python -m unittest discover -s tests -v     PASS (SQLAlchemy 2.0.52 on Python 3.13)
node --test tests/questionBank.test.mjs      PASS
```
