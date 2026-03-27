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

const physicalFieldIds = [
  "style",
  "backgroundColor",
  "skinColor",
  "top",
  "hairColor",
  "hatColor",
  "eyes",
  "eyebrows",
  "mouth",
  "facialHair",
  "facialHairColor",
] as const;

const lockedAtSignupFieldIds = [
  "accessories",
  "accessoriesColor",
  "clothing",
  "clothesColor",
  "clothingGraphic",
] as const;

const avatarUnlockRules = [
  {
    id: "clothing-shirt-crew-neck",
    title: "Crew neck shirt",
    description: "Unlock the crew neck shirt customization.",
    thresholdKm: 25,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "shirtCrewNeck",
  },
  {
    id: "clothing-shirt-v-neck",
    title: "V-neck shirt",
    description: "Unlock the V-neck shirt customization.",
    thresholdKm: 75,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "shirtVNeck",
  },
  {
    id: "accessory-eyepatch",
    title: "Eye patch",
    description: "Unlock the eye patch accessory.",
    thresholdKm: 100,
    rewardType: "ACCESSORY",
    field: "accessories",
    value: "eyepatch",
  },
  {
    id: "clothing-graphic-shirt",
    title: "Graphic shirt",
    description: "Unlock the graphic shirt outfit.",
    thresholdKm: 200,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "graphicShirt",
  },
  {
    id: "clothing-overall",
    title: "Overall",
    description: "Unlock the overall outfit.",
    thresholdKm: 350,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "overall",
  },
  {
    id: "accessory-round",
    title: "Round glasses",
    description: "Unlock the round glasses accessory.",
    thresholdKm: 400,
    rewardType: "ACCESSORY",
    field: "accessories",
    value: "round",
  },
  {
    id: "clothing-blazer-shirt",
    title: "Blazer and shirt",
    description: "Unlock the blazer and shirt outfit.",
    thresholdKm: 600,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "blazerAndShirt",
  },
  {
    id: "accessory-wayfarers",
    title: "Wayfarers",
    description: "Unlock the wayfarers accessory.",
    thresholdKm: 750,
    rewardType: "ACCESSORY",
    field: "accessories",
    value: "wayfarers",
  },
  {
    id: "accessory-sunglasses",
    title: "Sunglasses",
    description: "Unlock the sunglasses accessory.",
    thresholdKm: 1000,
    rewardType: "ACCESSORY",
    field: "accessories",
    value: "sunglasses",
  },
  {
    id: "clothing-blazer-sweater",
    title: "Blazer and sweater",
    description: "Unlock the blazer and sweater outfit.",
    thresholdKm: 1200,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "blazerAndSweater",
  },
  {
    id: "accessory-prescription01",
    title: "Prescription glasses 01",
    description: "Unlock the first prescription glasses style.",
    thresholdKm: 1400,
    rewardType: "ACCESSORY",
    field: "accessories",
    value: "prescription01",
  },
  {
    id: "clothing-collar-sweater",
    title: "Collar and sweater",
    description: "Unlock the collar and sweater outfit.",
    thresholdKm: 1600,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "collarAndSweater",
  },
  {
    id: "accessory-prescription02",
    title: "Prescription glasses 02",
    description: "Unlock the second prescription glasses style.",
    thresholdKm: 1800,
    rewardType: "ACCESSORY",
    field: "accessories",
    value: "prescription02",
  },
  {
    id: "clothing-shirt-scoop-neck",
    title: "Scoop neck shirt",
    description: "Unlock the scoop neck shirt outfit.",
    thresholdKm: 2000,
    rewardType: "CLOTHING",
    field: "clothing",
    value: "shirtScoopNeck",
  },
] as const;

const canFallback = (error: unknown) =>
  error instanceof PrismaClientKnownRequestError && error.code === "P1001";

function extractAvatarId(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null;
  }

  const match = avatarUrl.match(/\/([A-Z0-9]{1,20})(?=\/(?:avatar|crop)b?\.png$)/i);
  return match?.[1] ?? null;
}

function toAvatarPreviewUrl(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null;
  }

  return avatarUrl;
}

function getSessionDurationMinutes(startAt: Date | string, endAt: Date | string) {
  const start = startAt instanceof Date ? startAt.getTime() : new Date(startAt).getTime();
  const end = endAt instanceof Date ? endAt.getTime() : new Date(endAt).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

function roundDistance(value: number) {
  return Math.round(value * 100) / 100;
}

function getDistanceKmFromCompletedData(completedData: Prisma.JsonValue | null | undefined) {
  if (!completedData || typeof completedData !== "object" || Array.isArray(completedData)) {
    return null;
  }

  const distanceKm = completedData.distanceKm;
  return typeof distanceKm === "number" && Number.isFinite(distanceKm) ? distanceKm : null;
}

async function getRunningProgress(userId: string) {
  try {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        userId,
        status: SessionStatus.COMPLETED,
        sport: "RUNNING",
      },
      select: {
        startAt: true,
        endAt: true,
        completedData: true,
      },
    });

    return {
      completedRuns: sessions.length,
      totalRunningKm: roundDistance(
        sessions.reduce((sum, session) => sum + (getDistanceKmFromCompletedData(session.completedData) ?? 0), 0),
      ),
    };
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }
  }

  return {
    completedRuns: devSessionsStore.filter(
      (session) => session.userId === userId && session.status === SessionStatus.COMPLETED && session.sport === "RUNNING",
    ).length,
    totalRunningKm: roundDistance(
      devSessionsStore.reduce((sum, session) => {
        if (session.userId !== userId || session.status !== SessionStatus.COMPLETED || session.sport !== "RUNNING") {
          return sum;
        }

        return sum + (getDistanceKmFromCompletedData(session.completedData as Prisma.JsonValue) ?? 0);
      }, 0),
    ),
  };
}

function buildUnlockCatalog(totalRunningKm: number) {
  const unlockedRules = avatarUnlockRules.filter((rule) => totalRunningKm >= rule.thresholdKm);
  const nextUnlockRule =
    avatarUnlockRules.find((rule) => totalRunningKm < rule.thresholdKm) ?? null;
  const previousThresholdKm =
    avatarUnlockRules
      .filter((rule) => rule.thresholdKm <= totalRunningKm)
      .reduce((max, rule) => Math.max(max, rule.thresholdKm), 0);

  const unlockedAccessories = unlockedRules
    .filter((rule) => rule.field === "accessories")
    .map((rule) => rule.value);

  const unlockedClothing = unlockedRules
    .filter((rule) => rule.field === "clothing")
    .map((rule) => rule.value);

  const clothingUnlocked = unlockedClothing.length > 0;
  const accessoriesUnlocked = unlockedAccessories.length > 0;

  const nextUnlock = nextUnlockRule
    ? {
        id: nextUnlockRule.id,
        title: nextUnlockRule.title,
        description: nextUnlockRule.description,
        rewardType: nextUnlockRule.rewardType,
        thresholdKm: nextUnlockRule.thresholdKm,
        currentKm: totalRunningKm,
        previousThresholdKm,
        remainingKm: roundDistance(Math.max(nextUnlockRule.thresholdKm - totalRunningKm, 0)),
        progressPercent:
          nextUnlockRule.thresholdKm === previousThresholdKm
            ? 100
            : Math.min(
                ((totalRunningKm - previousThresholdKm) /
                  (nextUnlockRule.thresholdKm - previousThresholdKm)) *
                  100,
                100,
              ),
      }
    : null;

  return {
    totalRunningKm,
    unlockedCount: unlockedRules.length,
    nextUnlock,
    availableOptions: {
      accessories: ["blank", ...unlockedAccessories],
      clothing: clothingUnlocked ? ["hoodie", ...unlockedClothing] : ["hoodie"],
      clothesColor: clothingUnlocked ? "all" : "locked",
      clothingGraphic: clothingUnlocked ? "all" : "locked",
      accessoriesColor: accessoriesUnlocked ? "all" : "locked",
    },
    lockedFields: [
      ...(accessoriesUnlocked ? [] : ["accessories", "accessoriesColor"]),
      ...(clothingUnlocked ? [] : ["clothing", "clothesColor", "clothingGraphic"]),
    ],
  };
}

function buildAvatarProfile(
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    rewardEvents?: Array<{ points: number }>;
  },
  runningProgress: {
    completedRuns: number;
    totalRunningKm: number;
  },
) {
  const totalPoints = user.rewardEvents?.reduce((sum, event) => sum + event.points, 0) ?? 0;
  const level = Math.max(1, Math.floor(totalPoints / 500) + 1);
  const unlockCatalog = buildUnlockCatalog(runningProgress.totalRunningKm);

  return {
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarProviderId: extractAvatarId(user.avatarUrl),
    avatarPreviewUrl: toAvatarPreviewUrl(user.avatarUrl),
    unlocksEnabled: false,
    progression: {
      level,
      experiencePoints: totalPoints,
      streakDays: 0,
    },
    cosmeticPolicy: {
      baseCatalog: "avataaars-local-2d",
      lockedCatalogs: ["achievement-rewards", "seasonal-drops", "xp-shop"],
    },
    creatorPolicy: {
      targetMode: "in-app-2d-avatar",
      allowedAtSignup: [...physicalFieldIds],
      lockedAtSignup: [...lockedAtSignupFieldIds],
      providerConstraint:
        "Avataaars is rendered locally in the web app and stored as an SVG data URL on the user profile.",
    },
    runningProgress: {
      totalRunningKm: runningProgress.totalRunningKm,
      completedRuns: runningProgress.completedRuns,
    },
    unlockCatalog,
    unlockProgress: avatarUnlockRules.map((rule) => ({
      ...rule,
      currentProgressKm: Math.min(runningProgress.totalRunningKm, rule.thresholdKm),
      totalRunningKm: runningProgress.totalRunningKm,
      completedRuns: runningProgress.completedRuns,
      remainingKm: roundDistance(Math.max(rule.thresholdKm - runningProgress.totalRunningKm, 0)),
      isUnlocked: runningProgress.totalRunningKm >= rule.thresholdKm,
    })),
  };
}

async function getAvatarProfile(userId: string) {
  const runningProgress = await getRunningProgress(userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: avatarProfileSelect,
    });

    if (user) {
      return buildAvatarProfile(user, runningProgress);
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
    }, runningProgress);
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

    const runningProgress = await getRunningProgress(payload.userId);
    response.json(buildAvatarProfile(updatedUser, runningProgress));
    return;
  } catch (error) {
    if (payload.userId === DEV_PROFILE.id) {
      DEV_PROFILE.avatarUrl = payload.avatarUrl;
      const runningProgress = await getRunningProgress(payload.userId);
      response.json(
        buildAvatarProfile({
          id: DEV_PROFILE.id,
          displayName: DEV_PROFILE.displayName,
          avatarUrl: DEV_PROFILE.avatarUrl,
          rewardEvents: [],
        }, runningProgress),
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
