import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { DEV_PROFILE } from "../shared/dev-data.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SportEnum = z.enum(["RUNNING", "GYM", "CYCLING", "MOBILITY", "SWIMMING", "OTHER"]);

const AIMissionSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetSessions: z.number().int().min(1).max(7),
  sport: SportEnum,
  rewardPoints: z.number().int().min(10).max(300),
});

const AIMissionsResponseSchema = z.object({
  missions: z.array(AIMissionSchema).min(1).max(5),
});

type AIMission = z.infer<typeof AIMissionSchema>;

export type UserContext = {
  primarySport: string;
  recentSessionCount: number;
  sessionsBySport: Record<string, number>;
  completedSessionCount: number;
};

export type MissionDto = {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  sport: string;
  rewardPoints: number;
  targetSessions: number;
  completed: boolean;
  completedAt: string | null;
};

type DevMission = MissionDto & { userId: string; weekStart: string };

export type FeedPostDto = {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  sport: string;
  createdAt: string;
};

export type LeaderboardEntryDto = {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
};

export type FriendDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  friendshipCreatedAt: string;
};

export type FriendSuggestionDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  primarySport: string;
  completedSessions: number;
};

const devMissionsStore: DevMission[] = [];
const devRewardStore: Record<string, number> = {};
const devDisplayNames: Record<string, string> = {
  [DEV_PROFILE.id]: DEV_PROFILE.displayName,
};

function getWeekStart(): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

function getWeekEnd(): Date {
  const start = new Date(getWeekStart());
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start;
}

const canFallback = (error: unknown) =>
  error instanceof PrismaClientKnownRequestError
  && (error.code === "P1001" || error.code === "P2021");

const prismaFriendship = prisma as typeof prisma & {
  friendship: {
    findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
    upsert: (args: unknown) => Promise<unknown>;
  };
};

function normalizeFriendPair(userId: string, friendId: string): { userId: string; friendId: string } {
  return userId < friendId ? { userId, friendId } : { userId: friendId, friendId: userId };
}

async function getFriendIds(userId: string): Promise<string[]> {
  const links = await prismaFriendship.friendship.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
    },
    select: {
      userId: true,
      friendId: true,
    },
  }) as Array<{ userId: string; friendId: string }>;
  return links.map((link) => (link.userId === userId ? link.friendId : link.userId));
}

async function callGemini(prompt: string): Promise<AIMission[]> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Add it to backend .env to enable AI missions.");
  }

  const response = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const raw = data.candidates[0]?.content?.parts[0]?.text;
  if (!raw) throw new Error("Gemini returned an empty response");

  return AIMissionsResponseSchema.parse(JSON.parse(raw)).missions;
}

function buildPrompt(context: UserContext, count: number): string {
  const sportBreakdown = Object.entries(context.sessionsBySport)
    .map(([sport, n]) => `${sport}: ${n}`)
    .join(", ");

  return `You are a sports coach AI for a fitness tracking app called FitQuest.
Generate exactly 3 personalized weekly training missions for an athlete with the following profile:

- Primary sport: ${context.primarySport}
- Total sessions in the last 2 weeks: ${context.recentSessionCount}
- Sessions by sport: ${sportBreakdown || "no data yet"}
- Completed sessions in the last 2 weeks: ${context.completedSessionCount}

Goal:
Encourage regular physical activity through simple, realistic, and safe weekly tasks.

Mission system:
You must generate exactly 3 missions, each representing a different mission type:

1. Routine Mission
Maintains consistency in the athlete's main sport.

2. Exploration Mission
Encourages trying a complementary or different sport.

3. Recovery Mission
Encourages mobility, stretching, or light recovery activity.

Mission design requirements:
- Missions must be specific and actionable.
- Prefer including a suggested day (Monday, Wednesday, weekend, etc.).
- Each mission should describe a concrete task (duration, type of session, or simple objective).
- Missions must remain safe and achievable.

Description style requirements:
- The description must be a simple instruction describing the task.
- Do NOT include motivational language, coaching advice, or commentary.
- Do NOT include phrases like "enjoy", "remember", "focus on", "you will feel", etc.
- The description must only state the task.

Rules:
- Missions must be achievable in one week (targetSessions between 1 and 7)
- If recentSessionCount is low, generate easier missions (1-2 sessions)
- Favor the primary sport for the Routine mission
- Exploration mission should use a different or complementary sport
- Recovery mission should use MOBILITY or light activity

Reward points rules:
- Routine mission: 40-90 points
- Exploration mission: 70-140 points
- Recovery mission: 30-70 points

Formatting rules:
- Indicate the mission type in the title (e.g., "Routine Mission - Midweek Run").
- Do not repeat the same sport more than twice.

Respond ONLY with a valid JSON object in this exact format, no markdown, no explanation:

{
  "missions": [
    {
      "title": "string",
      "description": "string",
      "targetSessions": number,
      "sport": "RUNNING" | "GYM" | "CYCLING" | "MOBILITY" | "SWIMMING" | "OTHER",
      "rewardPoints": number
    }
  ]
}`;
}

export async function getFriends(userId: string): Promise<FriendDto[]> {
  const links = await prismaFriendship.friendship.findMany({
    where: { OR: [{ userId }, { friendId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      friend: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  }) as Array<{
    userId: string;
    friendId: string;
    createdAt: Date;
    user: { id: string; displayName: string; avatarUrl: string | null };
    friend: { id: string; displayName: string; avatarUrl: string | null };
  }>;

  return links
    .map((link) => {
      const friendUser = link.userId === userId ? link.friend : link.user;
      return {
        id: friendUser.id,
        displayName: friendUser.displayName,
        avatarUrl: friendUser.avatarUrl,
        friendshipCreatedAt: link.createdAt.toISOString(),
      };
    })
    .filter((friend) => friend.id !== DEV_PROFILE.id);
}

export async function getFriendSuggestions(userId: string): Promise<FriendSuggestionDto[]> {
  const friendIds = await getFriendIds(userId);
  const excluded = new Set([userId, ...friendIds, DEV_PROFILE.id]);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excluded) },
      passwordHash: { not: null },
    },
    take: 8,
    include: {
      profile: {
        select: { primarySport: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const completedByUser = await prisma.trainingSession.groupBy({
    by: ["userId"],
    where: {
      userId: { in: users.map((u) => u.id) },
      status: "COMPLETED",
    },
    _count: { _all: true },
  });

  const completedMap = Object.fromEntries(completedByUser.map((g) => [g.userId, g._count._all]));

  return users
    .map((user) => ({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      primarySport: user.profile?.primarySport ?? "OTHER",
      completedSessions: completedMap[user.id] ?? 0,
    }))
    .sort((a, b) => b.completedSessions - a.completedSessions)
    .slice(0, 5);
}

export async function addFriend(userId: string, friendId: string): Promise<FriendDto> {
  if (userId === friendId) {
    throw new Error("You cannot add yourself as a friend");
  }

  const pair = normalizeFriendPair(userId, friendId);

  if (friendId === DEV_PROFILE.id) {
    throw new Error("Demo account cannot be added as a friend");
  }

  await prismaFriendship.friendship.upsert({
    where: {
      userId_friendId: {
        userId: pair.userId,
        friendId: pair.friendId,
      },
    },
    update: {},
    create: {
      userId: pair.userId,
      friendId: pair.friendId,
    },
  });

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { id: true, displayName: true, avatarUrl: true },
  });

  if (!friend) {
    throw new Error("Friend user not found");
  }

  return {
    id: friend.id,
    displayName: friend.displayName,
    avatarUrl: friend.avatarUrl,
    friendshipCreatedAt: new Date().toISOString(),
  };
}

export async function getUserMissions(userId: string): Promise<MissionDto[]> {
  const weekStart = new Date(getWeekStart());
  try {
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId, challenge: { status: "ACTIVE", startsAt: { gte: weekStart } } },
      include: { challenge: true },
      orderBy: { createdAt: "asc" },
    });
    return userChallenges.map((uc) => ({
      id: uc.id,
      challengeId: uc.challengeId,
      title: uc.challenge.title,
      description: uc.challenge.description ?? "",
      sport: uc.challenge.sport ?? "OTHER",
      rewardPoints: uc.challenge.rewardPoints,
      targetSessions: uc.challenge.targetSessions,
      completed: uc.completedAt !== null,
      completedAt: uc.completedAt?.toISOString() ?? null,
    }));
  } catch (error) {
    if (!canFallback(error)) throw error;
    const weekKey = getWeekStart();
    return devMissionsStore.filter((m) => m.userId === userId && m.weekStart === weekKey);
  }
}

export async function generateAndSaveMissions(
  userId: string,
  context: UserContext,
): Promise<MissionDto[]> {
  const missions = await callGemini(buildPrompt(context, 4));
  const weekStart = new Date(getWeekStart());
  const weekEnd = getWeekEnd();

  try {
    const existing = await prisma.userChallenge.findMany({
      where: { userId, challenge: { status: "ACTIVE", startsAt: { gte: weekStart } } },
      select: { id: true, challengeId: true },
    });
    if (existing.length > 0) {
      await prisma.userChallenge.deleteMany({ where: { id: { in: existing.map((e) => e.id) } } });
      await prisma.challenge.deleteMany({ where: { id: { in: existing.map((e) => e.challengeId) } } });
    }

    const created: MissionDto[] = [];
    for (const m of missions) {
      const challenge = await prisma.challenge.create({
        data: {
          title: m.title,
          description: m.description,
          sport: m.sport,
          rewardPoints: m.rewardPoints,
          targetSessions: m.targetSessions,
          status: "ACTIVE",
          startsAt: weekStart,
          endsAt: weekEnd,
        },
      });
      const uc = await prisma.userChallenge.create({
        data: { userId, challengeId: challenge.id, progress: 0 },
      });
      created.push({
        id: uc.id,
        challengeId: challenge.id,
        title: m.title,
        description: m.description,
        sport: m.sport,
        rewardPoints: m.rewardPoints,
        targetSessions: m.targetSessions,
        completed: false,
        completedAt: null,
      });
    }
    return created;
  } catch (error) {
    if (!canFallback(error)) throw error;
    const weekKey = getWeekStart();
    devMissionsStore.splice(
      0,
      devMissionsStore.length,
      ...devMissionsStore.filter((m) => !(m.userId === userId && m.weekStart === weekKey)),
    );
    const created: MissionDto[] = missions.map((m) => ({
      id: crypto.randomUUID(),
      challengeId: crypto.randomUUID(),
      title: m.title,
      description: m.description,
      sport: m.sport,
      rewardPoints: m.rewardPoints,
      targetSessions: m.targetSessions,
      completed: false,
      completedAt: null,
    }));
    devMissionsStore.push(...created.map((m) => ({ ...m, userId, weekStart: weekKey })));
    return created;
  }
}

export async function toggleMissionComplete(
  userChallengeId: string,
  userId: string,
): Promise<{ mission: MissionDto; totalPoints: number }> {
  try {
    const uc = await prisma.userChallenge.findFirst({
      where: { id: userChallengeId, userId },
      include: { challenge: true },
    });
    if (!uc) throw new Error("Mission not found");

    const nowCompleted = uc.completedAt === null;
    const updated = await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        completedAt: nowCompleted ? new Date() : null,
        progress: nowCompleted ? uc.challenge.targetSessions : 0,
      },
      include: { challenge: true },
    });

    if (nowCompleted) {
      await prisma.rewardEvent.create({
        data: {
          userId,
          label: `Mission completed: ${uc.challenge.title}`,
          source: "mission",
          points: uc.challenge.rewardPoints,
        },
      });
      await prisma.socialPost.create({
        data: {
          userId,
          visibility: "PUBLIC",
          content: JSON.stringify({
            type: "mission_completed",
            missionTitle: uc.challenge.title,
            sport: uc.challenge.sport ?? "OTHER",
            rewardPoints: uc.challenge.rewardPoints,
          }),
        },
      });
    } else {
      await prisma.rewardEvent.deleteMany({
        where: { userId, source: "mission", label: `Mission completed: ${uc.challenge.title}` },
      });
      await prisma.socialPost.deleteMany({
        where: {
          userId,
          content: {
            contains: `"type":"mission_completed","missionTitle":"${uc.challenge.title}`,
          },
        },
      });
    }

    const totalPoints = await prisma.rewardEvent.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return {
      mission: {
        id: updated.id,
        challengeId: updated.challengeId,
        title: updated.challenge.title,
        description: updated.challenge.description ?? "",
        sport: updated.challenge.sport ?? "OTHER",
        rewardPoints: updated.challenge.rewardPoints,
        targetSessions: updated.challenge.targetSessions,
        completed: updated.completedAt !== null,
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
      totalPoints: totalPoints._sum.points ?? 0,
    };
  } catch (error) {
    if (!canFallback(error)) throw error;
    const mission = devMissionsStore.find((m) => m.id === userChallengeId && m.userId === userId);
    if (!mission) throw new Error("Mission not found");
    mission.completed = !mission.completed;
    mission.completedAt = mission.completed ? new Date().toISOString() : null;
    if (mission.completed) {
      devRewardStore[userId] = (devRewardStore[userId] ?? 0) + mission.rewardPoints;
    } else {
      devRewardStore[userId] = Math.max(0, (devRewardStore[userId] ?? 0) - mission.rewardPoints);
    }
    return { mission: { ...mission }, totalPoints: devRewardStore[userId] ?? 0 };
  }
}

export async function regenerateOneMission(
  userChallengeId: string,
  userId: string,
  context: UserContext,
): Promise<MissionDto> {
  const [newMission] = await callGemini(buildPrompt(context, 1));
  const weekStart = new Date(getWeekStart());
  const weekEnd = getWeekEnd();

  try {
    const uc = await prisma.userChallenge.findFirst({
      where: { id: userChallengeId, userId },
      select: { challengeId: true },
    });
    if (!uc) throw new Error("Mission not found");

    await prisma.userChallenge.delete({ where: { id: userChallengeId } });
    await prisma.challenge.delete({ where: { id: uc.challengeId } });

    const challenge = await prisma.challenge.create({
      data: {
        title: newMission.title,
        description: newMission.description,
        sport: newMission.sport,
        rewardPoints: newMission.rewardPoints,
        targetSessions: newMission.targetSessions,
        status: "ACTIVE",
        startsAt: weekStart,
        endsAt: weekEnd,
      },
    });
    const newUc = await prisma.userChallenge.create({
      data: { userId, challengeId: challenge.id, progress: 0 },
    });

    return {
      id: newUc.id,
      challengeId: challenge.id,
      title: newMission.title,
      description: newMission.description,
      sport: newMission.sport,
      rewardPoints: newMission.rewardPoints,
      targetSessions: newMission.targetSessions,
      completed: false,
      completedAt: null,
    };
  } catch (error) {
    if (!canFallback(error)) throw error;
    const weekKey = getWeekStart();
    const idx = devMissionsStore.findIndex((m) => m.id === userChallengeId && m.userId === userId);
    if (idx === -1) throw new Error("Mission not found");
    const replacement: DevMission = {
      id: crypto.randomUUID(),
      challengeId: crypto.randomUUID(),
      userId,
      weekStart: weekKey,
      title: newMission.title,
      description: newMission.description,
      sport: newMission.sport,
      rewardPoints: newMission.rewardPoints,
      targetSessions: newMission.targetSessions,
      completed: false,
      completedAt: null,
    };
    devMissionsStore.splice(idx, 1, replacement);
    return { ...replacement };
  }
}

export async function getTotalPoints(userId: string): Promise<number> {
  try {
    const result = await prisma.rewardEvent.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  } catch (error) {
    if (!canFallback(error)) throw error;
    return devRewardStore[userId] ?? 0;
  }
}

export async function getFeed(userId: string): Promise<FeedPostDto[]> {
  const friendIds = (await getFriendIds(userId)).filter((id) => id !== DEV_PROFILE.id);
  if (friendIds.length === 0) return [];

  const sessions = await prisma.trainingSession.findMany({
    where: {
      userId: { in: friendIds },
      status: "COMPLETED",
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      user: {
        select: { displayName: true },
      },
    },
  });

  const completedMissions = await prisma.userChallenge.findMany({
    where: {
      userId: { in: friendIds },
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: 30,
    include: {
      challenge: {
        select: {
          title: true,
          sport: true,
          rewardPoints: true,
        },
      },
      user: {
        select: { displayName: true },
      },
    },
  });

  const sessionFeed: FeedPostDto[] = sessions.map((session) => ({
    id: session.id,
    userId: session.userId,
    displayName: session.user.displayName,
    content: JSON.stringify({
      type: "session_completed",
      sessionTitle: session.title,
      sport: session.sport,
    }),
    sport: session.sport,
    createdAt: session.updatedAt.toISOString(),
  }));

  const missionFeed: FeedPostDto[] = completedMissions.map((mission) => ({
    id: `mission-${mission.id}`,
    userId: mission.userId,
    displayName: mission.user.displayName,
    content: JSON.stringify({
      type: "mission_completed",
      missionTitle: mission.challenge.title,
      sport: mission.challenge.sport ?? "OTHER",
      rewardPoints: mission.challenge.rewardPoints,
    }),
    sport: mission.challenge.sport ?? "OTHER",
    createdAt: mission.completedAt?.toISOString() ?? mission.createdAt.toISOString(),
  }));

  return [...sessionFeed, ...missionFeed]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);
}

export async function getLeaderboard(): Promise<LeaderboardEntryDto[]> {
  try {
    const groups = await prisma.rewardEvent.groupBy({
      by: ["userId"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: 10,
    });
    const userIds = groups.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true },
    });
    const nameMap = Object.fromEntries(users.map((u) => [u.id, u.displayName]));
    return groups.map((g, i) => ({
      rank: i + 1,
      userId: g.userId,
      displayName: nameMap[g.userId] ?? "Unknown",
      points: g._sum.points ?? 0,
    }));
  } catch (error) {
    if (!canFallback(error)) throw error;
    return Object.entries(devRewardStore)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([uid, pts], i) => ({
        rank: i + 1,
        userId: uid,
        displayName: devDisplayNames[uid] ?? "Unknown",
        points: pts,
      }));
  }
}
