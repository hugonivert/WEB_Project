import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { Prisma, SessionStatus } from "../../../../generated/prisma/client.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { DEV_PROFILE, devSessionsStore } from "../shared/dev-data.js";

const avatarProfileSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  rewardEvents: {
    select: {
      points: true,
    },
  },
} satisfies Prisma.UserSelect;

const inventorySelect = {
  equipped: true,
  item: {
    select: {
      id: true,
      name: true,
      category: true,
      rarity: true,
      pricePoints: true,
    },
  },
} satisfies Prisma.UserAvatarItemSelect;

const avatarQuerySchema = z.object({
  userId: z.string().uuid(),
});

const updateAvatarProfileSchema = z.object({
  userId: z.string().uuid(),
  avatarUrl: z.string().url(),
});

const trainingUnlockRules = [
  {
    id: "complete-5-30min-sessions",
    title: "Starter training outfit",
    description: "Complete 5 sport sessions lasting at least 30 minutes to unlock one clothing item.",
    threshold: 5,
    rewardType: "CLOTHING",
  },
] as const;

const canFallback = (error: unknown) =>
  error instanceof PrismaClientKnownRequestError && error.code === "P1001";

function extractAvatarId(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null;
  }

  const match = avatarUrl.match(/\/avatars\/([^/?]+)\.glb/i);
  return match?.[1] ?? null;
}

function toAvatarPreviewUrl(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null;
  }

  return avatarUrl.replace(/\.glb(\?.*)?$/i, ".png");
}

function getSessionDurationMinutes(startAt: Date | string, endAt: Date | string) {
  const start = startAt instanceof Date ? startAt.getTime() : new Date(startAt).getTime();
  const end = endAt instanceof Date ? endAt.getTime() : new Date(endAt).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

async function getSessionProgress(userId: string) {
  try {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        userId,
        status: SessionStatus.COMPLETED,
      },
      select: {
        startAt: true,
        endAt: true,
      },
    });

    return {
      qualifyingCompletedSessions: sessions.filter(
        (session) => getSessionDurationMinutes(session.startAt, session.endAt) >= 30,
      ).length,
    };
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }
  }

  return {
    qualifyingCompletedSessions: devSessionsStore.filter(
      (session) =>
        session.userId === userId &&
        session.status === SessionStatus.COMPLETED &&
        getSessionDurationMinutes(session.startAt, session.endAt) >= 30,
    ).length,
  };
}

function buildAvatarProfile(
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    rewardEvents?: Array<{ points: number }>;
  },
  sessionProgress: {
    qualifyingCompletedSessions: number;
  },
) {
  const totalPoints = user.rewardEvents?.reduce((sum, event) => sum + event.points, 0) ?? 0;
  const level = Math.max(1, Math.floor(totalPoints / 500) + 1);

  return {
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    rpmAvatarId: extractAvatarId(user.avatarUrl),
    avatarPreviewUrl: toAvatarPreviewUrl(user.avatarUrl),
    unlocksEnabled: false,
    progression: {
      level,
      experiencePoints: totalPoints,
      streakDays: 0,
    },
    cosmeticPolicy: {
      baseCatalog: "ready-player-me-default",
      lockedCatalogs: ["achievement-rewards", "seasonal-drops", "xp-shop"],
    },
    creatorPolicy: {
      targetMode: "traits-only-onboarding",
      allowedAtSignup: ["body-shape", "face-shape", "skin-color"],
      lockedAtSignup: ["clothing", "accessories"],
      providerConstraint:
        "The standard Ready Player Me web creator cannot fully enforce this UX; use a custom creator flow for strict control.",
    },
    unlockProgress: trainingUnlockRules.map((rule) => ({
      ...rule,
      currentProgress: Math.min(sessionProgress.qualifyingCompletedSessions, rule.threshold),
      qualifyingCompletedSessions: sessionProgress.qualifyingCompletedSessions,
      unlockedCount: Math.floor(sessionProgress.qualifyingCompletedSessions / rule.threshold),
      isUnlocked: sessionProgress.qualifyingCompletedSessions >= rule.threshold,
    })),
  };
}

async function getAvatarProfile(userId: string) {
  const sessionProgress = await getSessionProgress(userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: avatarProfileSelect,
    });

    if (user) {
      return buildAvatarProfile(user, sessionProgress);
    }
  } catch (error) {
    console.warn("Avatar profile lookup fell back to dev profile.", error);
  }

  if (userId === DEV_PROFILE.id) {
    return buildAvatarProfile({
      id: DEV_PROFILE.id,
      displayName: DEV_PROFILE.displayName,
      avatarUrl: DEV_PROFILE.avatarUrl,
      rewardEvents: [],
    }, sessionProgress);
  }

  return null;
}

async function listAvatarInventory(userId: string) {
  try {
    const inventory = await prisma.userAvatarItem.findMany({
      where: { userId },
      orderBy: {
        unlockedAt: "asc",
      },
      select: inventorySelect,
    });

    return {
      equippedItemIds: inventory.filter((entry) => entry.equipped).map((entry) => entry.item.id),
      unlockedItems: inventory.map((entry) => entry.item),
      futureSources: [
        "streaks",
        "challenge-completions",
        "experience-points",
        "badge-collections",
      ],
    };
  } catch (error) {
    console.warn("Avatar inventory lookup fell back to empty inventory.", error);
  }

  return {
    equippedItemIds: [],
    unlockedItems: [],
    futureSources: ["streaks", "challenge-completions", "experience-points", "badge-collections"],
  };
}

export const avatarRouter = Router();

avatarRouter.get("/profile", async (request, response) => {
  const { userId } = avatarQuerySchema.parse(request.query);
  const profile = await getAvatarProfile(userId);

  if (!profile) {
    response.status(404).json({
      message: "Avatar profile not found",
    });
    return;
  }

  response.json(profile);
});

avatarRouter.put("/profile", async (request, response) => {
  const payload = updateAvatarProfileSchema.parse(request.body);

  try {
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        avatarUrl: payload.avatarUrl,
      },
      select: avatarProfileSelect,
    });

    const sessionProgress = await getSessionProgress(payload.userId);
    response.json(buildAvatarProfile(updatedUser, sessionProgress));
    return;
  } catch (error) {
    if (payload.userId === DEV_PROFILE.id) {
      DEV_PROFILE.avatarUrl = payload.avatarUrl;
      const sessionProgress = await getSessionProgress(payload.userId);
      response.json(
        buildAvatarProfile({
          id: DEV_PROFILE.id,
          displayName: DEV_PROFILE.displayName,
          avatarUrl: DEV_PROFILE.avatarUrl,
          rewardEvents: [],
        }, sessionProgress),
      );
      return;
    }

    throw error;
  }
});

avatarRouter.get("/inventory", async (request, response) => {
  const { userId } = avatarQuerySchema.parse(request.query);
  const inventory = await listAvatarInventory(userId);

  response.json(inventory);
});
