# Backend collaboration guide

This backend is split by feature so each collaborator can work in one module without constant merge conflicts.

## Ownership map

1. Auth and access
   Backend folder: `backend/src/modules/auth`
   Main tables: `User`, `AthleteProfile`
   API prefix: `/api/auth`

2. Planner
   Backend folder: `backend/src/modules/planner`
   Main tables: `TrainingSession`
   API prefix: `/api/planner`

3. Performance
   Backend folder: `backend/src/modules/performance`
   Main tables: `PerformanceMetric`
   API prefix: `/api/performance`

4. Social and missions
   Backend folder: `backend/src/modules/social`
   Main tables: `SocialPost`, `Challenge`, `UserChallenge`
   API prefix: `/api/social`

5. Avatar and rewards
   Backend folder: `backend/src/modules/avatar`
   Main tables: `AvatarItem`, `UserAvatarItem`, `RewardEvent`
   API prefix: `/api/avatar`

## Shared files

These are the only files that should be treated as shared and discussed before editing:

- `prisma/schema.prisma`
- `backend/src/modules/index.ts`
- `backend/src/app.ts`
- `backend/src/lib/prisma.ts`
- `backend/src/config/env.ts`

## Conflict rules

- Each collaborator edits only their own module folder by default.
- New endpoints must stay under that module's API prefix.
- If someone needs a schema change in `prisma/schema.prisma`, they announce it first to the team.
- One person should be responsible for validating and merging schema changes.
- Shared enums should be added carefully because they affect multiple modules.

## Recommended backend workflow

1. Create a branch per feature, for example `backend/planner-api` or `backend/social-feed`.
2. Work only inside the assigned module folder unless a shared change is required.
3. If a shared change is required, make it in a separate commit with a clear message.
4. Run `npm run build:server` before pushing.
5. If the database schema changed, also run `npm run prisma:generate`.

## Suggested module internals

Inside each module, keep the same shape when the module grows:

- `*.routes.ts`: Express routes
- `*.service.ts`: business logic
- `*.schema.ts`: Zod validation
- `*.repository.ts`: Prisma queries if the module becomes larger

## Current starter endpoints

- `/api/auth/status`
- `/api/planner/sessions`
- `/api/performance/metrics`
- `/api/social/posts`
- `/api/avatar/inventory`
- `/api/users`

