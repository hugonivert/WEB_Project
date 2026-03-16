import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const AIMissionSchema = z.object({
  title: z.string(),
  description: z.string(),
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
  completed: boolean;
  completedAt: string | null;
};

// ─── In-memory fallback store ─────────────────────────────────────────────────

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

const devMissionsStore: DevMission[] = [];
const devRewardStore: Record<string, number> = {};
const devFeedStore: FeedPostDto[] = [];
const devDisplayNames: Record<string, string> = {
  "11111111-1111-4111-8111-111111111111": "Planner Demo",
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
  error instanceof PrismaClientKnownRequestError && error.code === "P1001";

// ─── AI call ─────────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<AIMission[]> {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to backend .env to enable AI missions.",
    );
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

  const data = (await response.json()) as {
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
- If recentSessionCount is low, generate easier missions (1–2 sessions)
- Favor the primary sport for the Routine mission
- Exploration mission should use a different or complementary sport
- Recovery mission should use MOBILITY or light activity

Reward points rules:
- Routine mission: 40–90 points
- Exploration mission: 70–140 points
- Recovery mission: 30–70 points

Formatting rules:
- Indicate the mission type in the title (e.g., "Routine Mission – Midweek Run").
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

// ─── Service functions ────────────────────────────────────────────────────────

export async function getUserMissions(userId: string): Promise<MissionDto[]> {
  const weekStart = new Date(getWeekStart());
  try {
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId,
        challenge: { status: "ACTIVE", startsAt: { gte: weekStart } },
      },
      include: { challenge: true },
      orderBy: { createdAt: "asc" },
    });
    return userChallenges.map((uc) => ({
      id: uc.id,
      challengeId: uc.challengeId,
      title: uc.challenge.title,
      description: uc.challenge.description ?? "",
      completed: uc.completedAt !== null,
      completedAt: uc.completedAt?.toISOString() ?? null,
    }));
  } catch (error) {
    if (!canFallback(error)) throw error;
    const weekKey = getWeekStart();
    return devMissionsStore.filter(
      (m) => m.userId === userId && m.weekStart === weekKey,
    );
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
    // Delete existing missions for this week
    const existing = await prisma.userChallenge.findMany({
      where: {
        userId,
        challenge: { status: "ACTIVE", startsAt: { gte: weekStart } },
      },
      select: { id: true, challengeId: true },
    });
    if (existing.length > 0) {
      await prisma.userChallenge.deleteMany({
        where: { id: { in: existing.map((e) => e.id) } },
      });
      await prisma.challenge.deleteMany({
        where: { id: { in: existing.map((e) => e.challengeId) } },
      });
    }

    // Create new challenges + user links
    const created: MissionDto[] = [];
    for (const m of missions) {
      const challenge = await prisma.challenge.create({
        data: {
          title: m.title,
          description: m.description,
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
      ...devMissionsStore.filter(
        (m) => !(m.userId === userId && m.weekStart === weekKey),
      ),
    );
    const created: MissionDto[] = missions.map((m) => ({
      id: crypto.randomUUID(),
      challengeId: crypto.randomUUID(),
      title: m.title,
      description: m.description,
      completed: false,
      completedAt: null,
    }));
    devMissionsStore.push(
      ...created.map((m) => ({ ...m, userId, weekStart: weekKey })),
    );
    return created;
  }
}

export async function toggleMissionComplete(
  userChallengeId: string,
  userId: string,
): Promise<{ mission: MissionDto; totalPoints: number }> {
  const mission = devMissionsStore.find(
    (m) => m.id === userChallengeId && m.userId === userId,
  );
  if (!mission) throw new Error("Mission not found");
  mission.completed = !mission.completed;
  mission.completedAt = mission.completed ? new Date().toISOString() : null;
  return { mission: { ...mission }, totalPoints: devRewardStore[userId] ?? 0 };
}

export async function regenerateOneMission(
  userChallengeId: string,
  userId: string,
  context: UserContext,
): Promise<MissionDto> {
  const [newMission] = await callGemini(buildPrompt(context, 1));
  const weekStart = new Date(getWeekStart());
  const weekEnd = getWeekEnd();

  const weekKey = getWeekStart();
  const idx = devMissionsStore.findIndex(
    (m) => m.id === userChallengeId && m.userId === userId,
  );
  if (idx === -1) throw new Error("Mission not found");
  const replacement: DevMission = {
    id: crypto.randomUUID(),
    challengeId: crypto.randomUUID(),
    userId,
    weekStart: weekKey,
    title: newMission.title,
    description: newMission.description,
    completed: false,
    completedAt: null,
  };
  devMissionsStore.splice(idx, 1, replacement);
  return { ...replacement };
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

export async function getFeed(): Promise<FeedPostDto[]> {
  try {
    const posts = await prisma.socialPost.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { displayName: true } } },
    });
    return posts.map((p) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(p.content) as Record<string, unknown>;
      } catch {
        /* not JSON */
      }
      return {
        id: p.id,
        userId: p.userId,
        displayName: p.user.displayName,
        content: p.content,
        sport: (parsed["sport"] as string) ?? "OTHER",
        createdAt: p.createdAt.toISOString(),
      };
    });
  } catch (error) {
    if (!canFallback(error)) throw error;
    return [...devFeedStore];
  }
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
