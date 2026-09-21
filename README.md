# Kids Bible Quiz

A mobile Bible quiz app for children aged 5–12, with a PostgreSQL-backed question bank and a web admin dashboard for managing questions and reviewing results.

Full requirements and implementation plan: [`Kids_Bible_Quiz_Claude_Build_Spec.md`](./Kids_Bible_Quiz_Claude_Build_Spec.md) and [`Kids_Bible_Quiz_Development_Plan.pdf`](./Kids_Bible_Quiz_Development_Plan.pdf).

## Project structure

```
kids-bible-quiz/
├── mobile/    React Native + Expo app (students)
├── server/    Node.js + Express API + Prisma + PostgreSQL
├── admin/     React + TypeScript admin dashboard
└── assets/    Client-supplied branding/audio assets
```

Each folder is an independent npm project (its own `package.json`/`node_modules`) rather than a single npm/yarn workspace — this avoids known Metro bundler issues when Expo projects sit inside a workspace root.

## Prerequisites

- Node.js (LTS recommended)
- PostgreSQL, running locally (see below)
- Expo Go app on a physical iPhone, for previewing the mobile app (no Mac/Xcode required for development)

## 1. Database setup

1. Open pgAdmin, connect to your local server.
2. Create a database named `kids_bible_quiz`.
3. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to your local Postgres password.

## 2. Server (API)

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

Health check: `http://localhost:4000/api/health` should return `{"status":"ok","database":"connected"}`.

## 3. Mobile app

```bash
cd mobile
npm install
npm run start
```

Scan the QR code with the Expo Go app on your phone.

## 4. Admin dashboard

```bash
cd admin
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Environment variables

See `server/.env.example` for the full list. Never commit `.env` files — only `.env.example` with placeholder values belongs in Git.

## Deployment (production)

- Database: [Neon](https://neon.tech) (managed PostgreSQL)
- API: [Render](https://render.com), configured via `render.yaml` at the repo root
- Admin dashboard: [Vercel](https://vercel.com), configured via `admin/vercel.json`

See Section 9 and Appendix A of the development plan PDF for the full deployment/handover rationale (why these three, and the account-ownership/handover considerations). The steps below are the mechanical setup.

### 1. Database — Neon

1. Create a free account at [neon.tech](https://neon.tech) and a new project (e.g. `kids-bible-quiz`).
2. Copy the connection string it gives you (the pooled one, ending `?sslmode=require`) — you'll paste it into Render in the next step, not into `.env` or Git.

### 2. API — Render

1. Create a free account at [render.com](https://render.com) and connect it to GitHub, authorizing only the `kids-bible-quiz` repo.
2. **New → Blueprint**, select this repo. Render reads `render.yaml` and pre-fills a web service rooted at `server/`.
3. Fill in the three prompted environment variables:
   - `DATABASE_URL` — the Neon connection string from step 1
   - `SESSION_SECRET` — a fresh random value, **different from the one in local `.env`** (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `CORS_ORIGIN` — the admin dashboard's Vercel URL from step 3 below (comma-separated if there's more than one, e.g. a custom domain later)
4. Deploy. The build runs `prisma generate` + `prisma migrate deploy` automatically, so the production schema is created on first deploy. Health check: `https://<your-service>.onrender.com/api/health`.
5. Seed the one shared admin account against the production database: `DATABASE_URL="<neon-connection-string>" npm run seed:admin --prefix server` (run this locally — Render's free tier doesn't include shell access). This prints a one-time placeholder password; change it via the admin dashboard's Settings screen after first login.
6. Render's free tier sleeps after 15 minutes of inactivity (~30–50s cold start on the next request). Upgrade to the paid Starter tier before real handover so the client's first login doesn't look broken.

### 3. Admin dashboard — Vercel

1. Create a free account at [vercel.com](https://vercel.com), connect GitHub, authorize only this repo.
2. **Add New → Project**, select this repo, and set **Root Directory** to `admin`. Vercel reads `admin/vercel.json` for the build command and SPA rewrite (needed so client-side routes like `/questions` don't 404 on refresh).
3. Set the one environment variable: `VITE_API_URL` = the Render URL from step 2 (no trailing slash).
4. Deploy. Once live, go back to Render and set `CORS_ORIGIN` to this Vercel URL if you hadn't yet.

### 4. Mobile app

Update `mobile/.env`'s `EXPO_PUBLIC_API_URL` to the Render URL to test against production instead of your LAN IP. A full EAS build/App Store submission is a separate, later decision (needs an Expo/EAS account, and a paid Apple Developer account if going to the App Store) — not required just to test against the deployed API via Expo Go.
