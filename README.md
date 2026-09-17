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
- API: [Render](https://render.com)
- Admin dashboard: Vercel or Netlify (static build)

See Section 9 and Appendix A of the development plan PDF for the full deployment/handover notes.
