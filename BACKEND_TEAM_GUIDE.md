# Backend team guide

This document explains how the backend is organized, who should work where, and how each collaborator should interact with the database.

## 1. Backend structure

The backend is split by feature under `backend/src/modules`.

- `backend/src/modules/auth`
  Owner: login / access collaborator
  Goal: authentication, current user, session handling

- `backend/src/modules/planner`
  Owner: planner collaborator
  Goal: training sessions, planner CRUD, calendar data

- `backend/src/modules/performance`
  Owner: performance collaborator
  Goal: metrics, analytics, summaries

- `backend/src/modules/social`
  Owner: social collaborator
  Goal: posts, challenges, mission logic

- `backend/src/modules/avatar`
  Owner: avatar collaborator
  Goal: rewards, inventory, unlocks, cosmetics

- `backend/src/modules/shared`
  Shared helpers used by several modules

## 2. Shared backend files

These files affect everyone and should be changed carefully:

- `prisma/schema.prisma`
- `backend/src/app.ts`
- `backend/src/modules/index.ts`
- `backend/src/lib/prisma.ts`
- `backend/src/config/env.ts`

Rule:
If a change touches one of these files, announce it to the group first.

## 3. How routes are registered

All API modules are connected in:

- `backend/src/modules/index.ts`

The Express app is created in:

- `backend/src/app.ts`

That means a collaborator usually works in their own module folder and only touches `backend/src/modules/index.ts` if a completely new module or route group must be mounted.

## 4. Database source of truth

The database structure is defined in:

- `prisma/schema.prisma`

This file is the source of truth for:

- tables
- columns
- relations
- enums

Do not create random tables manually in Supabase without also reflecting them in `prisma/schema.prisma`.

## 5. How collaborators should interact with the database

Use Prisma Client inside backend code.

Example pattern:

1. Add or update the model in `prisma/schema.prisma`
2. Generate the Prisma client
3. Use `prisma.<model>` inside the module service or route

Current Prisma client access is centralized in:

- `backend/src/lib/prisma.ts`

Example usage:

```ts
import { prisma } from "../../lib/prisma.js";

const sessions = await prisma.trainingSession.findMany({
  where: { userId },
});
```

## 6. Recommended work pattern per collaborator

Each collaborator should mainly stay inside their own backend folder.

Suggested internal file pattern for a module:

- `*.routes.ts`: HTTP endpoints
- `*.service.ts`: business logic
- `*.schema.ts`: Zod validation
- `*.repository.ts`: Prisma queries for bigger modules

For now, not every module has all these files yet, but this is the intended pattern as the backend grows.

## 7. How to add database features correctly

When a collaborator needs new data:

1. Update `prisma/schema.prisma`
2. Tell the group what changed
3. Run `npm run prisma:generate`
4. Update only their own module files
5. Run `npm run build:server`

Important:
In this project, Prisma Client works well for app code, but `prisma db push` may hang with the current Supabase pooler setup.

So use this rule:

- Prisma Client for application code: yes
- Prisma schema as source of truth: yes
- raw SQL only when schema deployment is blocked: yes

## 8. Current database models and ownership

- `User`
  Shared base user table
  Mainly used by auth

- `AthleteProfile`
  Shared athlete information
  Mainly used by auth and planner

- `TrainingSession`
  Planner owner

- `PerformanceMetric`
  Performance owner

- `SocialPost`
  Social owner

- `Challenge`
  Social owner

- `UserChallenge`
  Social owner

- `AvatarItem`
  Avatar owner

- `UserAvatarItem`
  Avatar owner

- `RewardEvent`
  Avatar owner

## 9. Current API prefixes

- `/api/auth`
- `/api/planner`
- `/api/performance`
- `/api/social`
- `/api/avatar`
- `/api/users`

Each collaborator should keep their endpoints inside their own prefix.

## 10. Local development commands

- `npm run dev:server`
  Start backend in watch mode

- `npm run dev`
  Start frontend

- `npm run dev:full`
  Start frontend and backend together

- `npm run prisma:generate`
  Regenerate Prisma client after schema changes

- `npm run build:server`
  Check backend TypeScript before pushing

## 11. Current testing mode

The planner module currently has a fake test profile and fallback data mode.

Why:

- the app needed to work before the database setup was fully stable

Now that the Supabase connection works, the planner also reads real database data.

## 12. Practical rules for the team

- Work in your own module folder by default
- Avoid editing shared files unless needed
- Announce Prisma schema changes before making them
- Run `npm run prisma:generate` after schema changes
- Run `npm run build:server` before pushing
- Keep route names inside your module prefix
- Use Prisma in code, not raw SQL, unless schema deployment is blocked

