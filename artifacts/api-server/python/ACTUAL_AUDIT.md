# Verified implementation audit

This audit is based on the source tree and runtime checks in the current checkout, not on the older status documents committed in the repository.

| Area | Status | Verified implementation | Remaining gap |
| --- | --- | --- | --- |
| Authentication | 🟡 PARTIAL | Flask JWT register/login/me/refresh, normalized emails, password hashing, protected routes, role checks, and one shared React auth provider. | Refresh tokens are stateless and logout is client-side; there is no token revocation store or rotation. |
| Ownership and roles | 🟡 PARTIAL | Student-owned vocabulary, mistakes, submissions, practice attempts; teachers are filtered to assigned students in student/submission routes. | Role coverage across every management route still needs a full authorization test matrix; the UI still treats teachers as admin-style users. |
| Dashboard | 🟡 PARTIAL | Today’s tasks, persisted submissions, streak, review counts, announcements, plan-backed progress, and teacher-reviewed bands are loaded from API data. | No single aggregate analytics endpoint; some dashboard summaries are computed client-side. |
| Reading practice | 🟡 PARTIAL | New authenticated reading set endpoint uses the repository question bank; answers are scored on the server, persisted, and returned with explanations/history. | The bank entries are short drill items rather than a verified four-passage/40-question Academic Reading exam. |
| Listening practice | ⚪ UNAVAILABLE | API and UI expose an honest unavailable state. Placeholder scripts are not presented as audio. | Real audio, transcript, section timing, scoring, and media storage are still required. |
| Writing | 🟡 PARTIAL | Editor, word count, timed practice, submission history, deterministic language/structure checks, and teacher review persistence exist. | No configured AI provider, no evidence-backed band evaluation, incomplete draft autosave, and no full criterion-level feedback model. |
| Speaking | 🟡 PARTIAL | Browser speech recognition where supported, transcript analysis, timers, prompts, audio upload path, and history exist. | Server-side pronunciation/audio evaluation and a persisted multi-part interviewer session are not complete. |
| AI layer | 🟡 PARTIAL | Rule-based language checks, debate diagnostics, follow-up prompts, risk report, study-plan recommendations, and next-drill recommendations are labeled as non-official diagnostics. | No configured external AI provider or genuine adaptive interviewer; no fabricated band scores are used. |
| Vocabulary | 🟡 PARTIAL | Database-backed vocabulary, due review, mastery/review count, and ownership checks exist. | Synonyms, IELTS relevance, difficulty, and richer spaced-repetition history are incomplete. |
| Mistake memory | 🟡 PARTIAL | Mistakes now write/read through the authenticated API; duplicate errors increment frequency and invalid writes are rejected. | Review status, explanations, source/date fields, retry/mastered workflow, and a dedicated database test remain. |
| Plans and tasks | 🟡 PARTIAL | Plans, assignments, task generation, daily tasks, submissions, and teacher management exist; PATCH now matches the frontend API. | Curriculum content is template-generated and progress persistence is not a complete learning-plan model. |
| Analytics | 🟡 PARTIAL | Reviewed bands, submission history, streaks, activity summaries, and practice-attempt history are persisted. | Skill/question-type/time-series analytics and real charts need a dedicated aggregate model/endpoint. |
| Full mock exam | ⚪ MISSING | The misleading static mock navigation was removed rather than presented as a real exam. | Persisted Reading → Listening → Writing → Speaking orchestration, real listening media, and aggregate scoring remain. |
| History/resume | 🟡 PARTIAL | Submission history, practice-attempt history, and teacher review history are available. | Test drafts and speaking-session resume are not server-backed. |
| UI/UX | 🟡 PARTIAL | Responsive existing UI, theme toggle, loading/error states, mobile navigation components, notifications, and honest empty states exist. | Full accessibility audit and route-level code splitting remain. |
| Performance | 🟡 PARTIAL | API timeout, rate limits, bounded history queries, and capped practice sets exist. | The main frontend bundle remains about 5.5 MB because the legacy monolithic App and large question bank are bundled together. |
| Security | 🟡 PARTIAL | Password hashing, JWT expiry, explicit CORS configuration, input validation in touched routes, rate limiting, and ownership checks exist. | Add refresh-token revocation/rotation, broader authorization tests, production rate-limit storage, and a security scan before deployment. |
| Database | 🟡 PARTIAL | SQLAlchemy models, PostgreSQL-compatible config, startup schema checks, and new `practice_attempts` persistence exist. | The project still relies on `create_all`/ad-hoc startup column additions rather than a complete migration system. |
| Deployment | 🟡 PARTIAL | Production config rejects SQLite/missing JWT/CORS, health endpoints, Gunicorn/Vercel files, and environment examples exist. | Configure hosted PostgreSQL, secrets, CORS origins, media storage, production rate-limit storage, and a real AI provider if desired. |

## Source-of-truth paths

- Frontend: `src/App.jsx`, `src/contexts/AuthContext.jsx`, `src/services/api.js`, and `src/pages/student/Practice.jsx`
- Backend factory/config: `app.py`, `config.py`
- API routes: `routes/`
- Persistence: `models/`
- Current runtime tests: `tests/test_schema.py`, `tests/test_api_flows.py`
