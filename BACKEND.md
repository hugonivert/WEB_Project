# Backend bootstrap

This project now includes a first backend version based on Express, Prisma, and PostgreSQL.

## Stack

- Frontend: Vite + React
- Backend: Express + TypeScript
- ORM: Prisma 7
- Database: PostgreSQL (Supabase)

## Available scripts

- `npm run dev:server`: start the backend in watch mode
- `npm run dev:full`: start frontend and backend together
- `npm run build`: build frontend and backend
- `npm run prisma:generate`: generate the Prisma client
- `npm run prisma:push`: push the Prisma schema to the database without a migration
- `npm run prisma:migrate -- --name init_backend`: create and apply a migration
- `npm run prisma:studio`: inspect the database with Prisma Studio
- `npm run prisma:seed`: insert a demo user and one planner session

## API

- `GET /api/health`
- `GET /api/users`
- `POST /api/users`
- `GET /api/auth/status`
- `GET /api/planner/test-profile`
- `GET /api/planner/sessions?userId=<uuid>&from=<iso-date>&to=<iso-date>`
- `POST /api/planner/sessions`
- `PUT /api/planner/sessions/:sessionId`
- `DELETE /api/planner/sessions/:sessionId`
- `GET /api/performance/metrics`
- `GET /api/social/posts`
- `GET /api/avatar/inventory`

## Database domains

The schema is intentionally broader than the planner so each teammate has a clear area:

- `User` and `AthleteProfile`: shared identity and athlete data
- `TrainingSession`: planner page
- `PerformanceMetric`: analytics page
- `SocialPost`, `Challenge`, `UserChallenge`: social and mission pages
- `AvatarItem`, `UserAvatarItem`, `RewardEvent`: avatar and rewards page

## Notes

- `.env` is ignored by git and already configured locally for the provided Supabase database.
- The Prisma client is generated into `generated/prisma`.
- The compiled backend entrypoint is `backend/dist/backend/src/index.js`.
- For production, replace `passwordHash` handling with a real auth flow and hashed passwords.
- The backend is now organized by modules under `backend/src/modules`.
- Collaboration rules are documented in `COLLABORATION_BACKEND.md`.
- The planner module exposes a fake test profile and falls back to in-memory planner data if the database is unreachable.
- Team onboarding and database workflow are documented in `BACKEND_TEAM_GUIDE.md`.
