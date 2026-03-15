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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrainingSessionSelect;

const sessionPayloadSchema = z
  .object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(120),
    sport: z.nativeEnum(SportType),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    notes: z.string().max(2000).optional(),
    location: z.string().max(160).optional(),
    status: z.nativeEnum(SessionStatus).optional(),
  })
  .refine((payload) => payload.endAt > payload.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

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
  const payload = sessionPayloadSchema.parse(request.body);
  const session = await createSession(payload);

  response.status(201).json(session);
});

plannerRouter.put("/sessions/:sessionId", async (request, response) => {
  const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(request.params);
  const payload = sessionPayloadSchema.partial({ userId: true }).parse(request.body);
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
