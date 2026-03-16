import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import type { Prisma } from "../../../../generated/prisma/client.js";
import { SessionStatus } from "../../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { DEV_PROFILE, devSessionsStore, type DevSession } from "../shared/dev-data.js";

type SessionPayload = {
  userId: string;
  title: string;
  sport: "RUNNING" | "GYM" | "CYCLING" | "MOBILITY" | "SWIMMING" | "OTHER";
  startAt: Date;
  endAt: Date;
  notes?: string;
  location?: string;
  status?: "PLANNED" | "COMPLETED" | "CANCELED";
  completedData?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
};

const canFallback = (error: unknown) =>
  error instanceof PrismaClientKnownRequestError && error.code === "P1001";

export async function listSessions(input: {
  userId: string;
  from?: Date;
  to?: Date;
}) {
  try {
    return await prisma.trainingSession.findMany({
      where: {
        userId: input.userId,
        startAt: {
          gte: input.from,
          lte: input.to,
        },
      },
      orderBy: {
        startAt: "asc",
      },
    });
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }

    return devSessionsStore
      .filter((session) => session.userId === input.userId)
      .filter((session) => (input.from ? new Date(session.startAt) >= input.from : true))
      .filter((session) => (input.to ? new Date(session.startAt) <= input.to : true))
      .sort((first, second) => first.startAt.localeCompare(second.startAt));
  }
}

export async function createSession(payload: SessionPayload) {
  try {
    return await prisma.trainingSession.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        sport: payload.sport,
        startAt: payload.startAt,
        endAt: payload.endAt,
        notes: payload.notes,
        location: payload.location,
        status: payload.status ?? SessionStatus.PLANNED,
        completedData: payload.completedData ?? undefined,
      },
    });
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }

    const now = new Date().toISOString();
    const session: DevSession = {
      id: crypto.randomUUID(),
      userId: payload.userId,
      title: payload.title,
      sport: payload.sport,
      startAt: payload.startAt.toISOString(),
      endAt: payload.endAt.toISOString(),
      notes: payload.notes ?? null,
      location: payload.location ?? null,
      status: payload.status ?? SessionStatus.PLANNED,
      completedData:
        (payload.completedData as Record<string, unknown> | undefined) ?? null,
      createdAt: now,
      updatedAt: now,
    };

    devSessionsStore.push(session);
    return session;
  }
}

export async function updateSession(sessionId: string, payload: Partial<SessionPayload>) {
  const updateData: Prisma.TrainingSessionUpdateInput = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.sport !== undefined) updateData.sport = payload.sport;
  if (payload.startAt !== undefined) updateData.startAt = payload.startAt;
  if (payload.endAt !== undefined) updateData.endAt = payload.endAt;
  if (payload.notes !== undefined) updateData.notes = payload.notes ?? null;
  if (payload.location !== undefined) updateData.location = payload.location ?? null;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.completedData !== undefined) updateData.completedData = payload.completedData;

  try {
    return await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }

    const session = devSessionsStore.find((entry) => entry.id === sessionId);
    if (!session) {
      throw error;
    }

    if (payload.title !== undefined) session.title = payload.title;
    if (payload.sport !== undefined) session.sport = payload.sport;
    if (payload.startAt !== undefined) session.startAt = payload.startAt.toISOString();
    if (payload.endAt !== undefined) session.endAt = payload.endAt.toISOString();
    if (payload.notes !== undefined) session.notes = payload.notes ?? null;
    if (payload.location !== undefined) session.location = payload.location ?? null;
    if (payload.status !== undefined) session.status = payload.status;
    if (payload.completedData !== undefined) {
      session.completedData =
        (payload.completedData as Record<string, unknown> | undefined) ?? null;
    }
    session.updatedAt = new Date().toISOString();

    return session;
  }
}

export async function deleteSession(sessionId: string) {
  try {
    await prisma.trainingSession.delete({
      where: { id: sessionId },
    });
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }

    const sessionIndex = devSessionsStore.findIndex((entry) => entry.id === sessionId);
    if (sessionIndex >= 0) {
      devSessionsStore.splice(sessionIndex, 1);
    }
  }
}

export async function getDevProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: DEV_PROFILE.email,
      },
      include: {
        profile: true,
      },
    });

    return user ?? DEV_PROFILE;
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }

    return DEV_PROFILE;
  }
}
