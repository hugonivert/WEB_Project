import { Prisma, SessionStatus, SportType } from "../../../../generated/prisma/client.js";
import { Router } from "express";
import { z } from "zod";
import {
  createSession,
  deleteSession,
  getDevProfile,
  listSessions,
  updateSession,
} from "./planner.service.js";

const sessionSelect = {
  id: true,
  userId: true,
  title: true,
  sport: true,
  startAt: true,
  endAt: true,
  notes: true,
  location: true,
  status: true,
  completedData: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrainingSessionSelect;

const runningCompletedDataSchema = z.object({
  distanceKm: z.number().positive(),
  durationMinutes: z.number().positive(),
  elevationGainM: z.number().min(0),
});

const cyclingCompletedDataSchema = z.object({
  distanceKm: z.number().positive(),
  durationMinutes: z.number().positive(),
  elevationGainM: z.number().min(0),
});

const gymCompletedDataSchema = z.object({
  exercisesCount: z.number().int().positive(),
  totalSets: z.number().int().positive(),
  totalLoadKg: z.number().min(0),
});

const mobilityCompletedDataSchema = z.object({
  durationMinutes: z.number().positive(),
  focusArea: z.string().min(1).max(120),
});

const completedDataSchema = z.union([
  runningCompletedDataSchema,
  cyclingCompletedDataSchema,
  gymCompletedDataSchema,
  mobilityCompletedDataSchema,
]);

function validateCompletedData(
  payload: {
    sport?: SportType;
    status?: SessionStatus;
    startAt?: Date;
    endAt?: Date;
    completedData?: z.infer<typeof completedDataSchema>;
  },
  context: z.RefinementCtx,
) {
  if (payload.startAt && payload.endAt && payload.endAt <= payload.startAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endAt must be after startAt",
      path: ["endAt"],
    });
  }

  if (payload.status === SessionStatus.COMPLETED && !payload.completedData) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "completedData is required when status is COMPLETED",
      path: ["completedData"],
    });
  }

  if (!payload.completedData) {
    return;
  }

  if (!payload.sport) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "sport is required when completedData is provided",
      path: ["sport"],
    });
    return;
  }

  let sportSchema: z.ZodTypeAny | undefined;

  switch (payload.sport) {
    case SportType.RUNNING:
      sportSchema = runningCompletedDataSchema;
      break;
    case SportType.CYCLING:
      sportSchema = cyclingCompletedDataSchema;
      break;
    case SportType.GYM:
      sportSchema = gymCompletedDataSchema;
      break;
    case SportType.MOBILITY:
      sportSchema = mobilityCompletedDataSchema;
      break;
    default:
      sportSchema = undefined;
  }

  if (!sportSchema) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "completedData is not supported for this sport",
      path: ["completedData"],
    });
    return;
  }

  const parsed = sportSchema.safeParse(payload.completedData);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      context.addIssue({
        ...issue,
        path: ["completedData", ...issue.path],
      });
    }
  }
}

const baseSessionPayloadSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(120),
  sport: z.nativeEnum(SportType),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().max(2000).optional(),
  location: z.string().max(160).optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  completedData: completedDataSchema.optional(),
});

const createSessionPayloadSchema = baseSessionPayloadSchema.superRefine(validateCompletedData);

const updateSessionPayloadSchema = baseSessionPayloadSchema
  .partial()
  .superRefine(validateCompletedData);

const listQuerySchema = z.object({
  userId: z.string().uuid(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const plannerRouter = Router();

plannerRouter.get("/sessions", async (request, response) => {
  const query = listQuerySchema.parse(request.query);
  const sessions = await listSessions(query);

  response.json(sessions);
});

plannerRouter.post("/sessions", async (request, response) => {
  const payload = createSessionPayloadSchema.parse(request.body);
  const session = await createSession(payload);

  response.status(201).json(session);
});

plannerRouter.put("/sessions/:sessionId", async (request, response) => {
  const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(request.params);
  const payload = updateSessionPayloadSchema.parse(request.body);
  const session = await updateSession(sessionId, payload);

  response.json(session);
});

plannerRouter.delete("/sessions/:sessionId", async (request, response) => {
  const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(request.params);
  await deleteSession(sessionId);

  response.status(204).send();
});

plannerRouter.get("/test-profile", async (_request, response) => {
  const profile = await getDevProfile();
  response.json(profile);
});
