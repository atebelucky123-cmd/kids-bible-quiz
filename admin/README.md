# Kids Bible Quiz — Admin Dashboard

React + TypeScript (Vite) web app for managing the question bank and reviewing
student activity. See Phase 11 of `Kids_Bible_Quiz_Development_Plan.pdf` for
the full design.

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if the API isn't on localhost:4000
npm run dev
```

Requires the `server/` API to be running (`npm run dev --prefix ../server`)
and at least one seeded admin account (`npm run seed:admin --prefix ../server`).

## Pages

- **Overview** — student/question/attempt counts, completion rate, and a
  by-age-band breakdown of attempts (a display-only grouping — questions
  themselves keep a freeform `ageMin`/`ageMax`).
- **Questions** — list, add, edit, deactivate, and delete questions. Deleting
  a question that already has recorded answers is blocked (deactivate it
  instead) to preserve grading history.
- **Students** — read-only. Never shows mobile numbers or password data.
- **Attempts** — every quiz attempt, filterable by status and student name.
- **Settings** — change the shared admin account's password. Not part of the
  original 4-tab UI design; added because the seeded admin's placeholder
  password is meant to be changed on first real use (see Appendix A of the
  development plan).

## Authentication

Reuses the same `POST /api/auth/login` endpoint as the mobile app
(first name + password) — the seeded account just has `role: ADMIN`. Session
is an httpOnly cookie; unlike the mobile app, the browser can rely on cookies
working consistently, so no token is stored client-side.
