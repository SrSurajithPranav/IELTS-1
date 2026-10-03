# IELTSPro — Smart Planner MVP (free stack)

React (Vite) + Flask + SQLite. Everything below costs ₹0.

## 1. Run locally (5 minutes)

```bash
# --- backend (Python 3.11+) ---
cd IELTS
python -m venv venv && source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                    # then edit JWT_SECRET_KEY
SEED_ADMIN_PASSWORD='pick-a-strong-password' SEED_ADMIN_EMAIL='you@example.com' python seed.py
python app.py                                           # API on http://localhost:5000

# --- frontend (Node 18+), second terminal ---
cd IELTS
npm install
npm run dev                                             # http://localhost:5173
```
Log in with the teacher e-mail/password you gave `seed.py`, create students under **Students**
(or let them sign up), then assign a plan.
`seed.py` creates the four plans (Solo 60/90 days, Group 60/90 days) with a task for every day.

## 2. How the pieces match your brief

| Requirement | Where |
|---|---|
| Daily plan, 60–90 days | Plans + Today's Tasks (plans/tasks tables; teacher edits under **Tasks**) |
| Solo = session every 2 days | Solo plans advance one task-day per 2 calendar days; **Solo Slots** (teacher) generates a slot every 2 days, students book under **1-on-1 Booking** |
| Batches by strength | **Batches**: level (beginner/intermediate/advanced) + max size + batch plan + batch live link |
| Speaking audio / writing text | Today's Tasks, Speaking, Writing, Mock Test |
| Teacher feedback (text + audio + band) | **Review** → students see it on the task card, with audio playback |
| Live class | Live Class page (Jitsi, free) + batch/teacher link, **Calendar**, quick-meet button; joining marks attendance |
| Progress, streak, weak areas | Progress page (real band chart), streak in sidebar, weak areas set by teacher, **My Report** (print → PDF) |
| Teacher insight | **Analytics** (submission trend, avg bands, batches, inactive students) |
| Notifications | Real-time via Socket.IO (feedback, announcements, bookings) |
| Installable on phone | PWA (manifest + service worker) — "Add to Home screen" |
| Mock AI | Grammar/structure checks are rule-based, free, no API keys |

## 3. Free deployment

| Part | Free option | Notes |
|---|---|---|
| Frontend | Vercel / Netlify / Cloudflare Pages | set `VITE_API_URL=https://your-api.onrender.com` |
| Backend | Render free web service | start: see `Procfile`; set `FLASK_ENV=production` |
| Database | Supabase or Neon free Postgres | paste into `DATABASE_URL`; production **requires** Postgres |
| Audio | Cloudinary free plan | set the 3 `CLOUDINARY_*` vars (production refuses to save audio on disk) |
| Video | Jitsi Meet (meet.jit.si) | no account; Zoom/Meet links also work |

To seed a hosted database once: run `seed.py` locally with `DATABASE_URL` pointing at it.
Free hosts sleep when idle (first request can take ~30–60 s) — fine for a class of this size.

## 4. Honest limits
* Band scores are **teacher-given**. The "rough band estimate" after mock MCQs is indicative only.
* Listening has no real audio test (no licensed audio is bundled); reading practice is server-scored from the question bank.
* Times for slots/sessions are stored in the school's local time (`APP_TZ_OFFSET_MINUTES`).
* This was syntax-checked end to end but I could not run the full stack in my sandbox (no package downloads) — run the steps above and report anything odd.
