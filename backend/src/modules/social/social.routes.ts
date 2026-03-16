import { Router } from "express";
import { z } from "zod";
import {
  getUserMissions,
  generateAndSaveMissions,
  toggleMissionComplete,
  regenerateOneMission,
  getTotalPoints,
  getFeed,
  getLeaderboard,
} from "./social.service.js";

export const socialRouter = Router();

// GET /api/social/posts
socialRouter.get("/posts", async (_request, response) => {
  try {
    const posts = await getFeed();
    response.json({ posts });
  } catch (error) {
    console.error("[social] GET /posts failed:", error);
    response.status(500).json({ error: "Failed to load feed" });
  }
});

// GET /api/social/leaderboard
socialRouter.get("/leaderboard", async (_request, response) => {
  try {
    const entries = await getLeaderboard();
    response.json({ entries });
  } catch (error) {
    console.error("[social] GET /leaderboard failed:", error);
    response.status(500).json({ error: "Failed to load leaderboard" });
  }
});

const UserContextSchema = z.object({
  primarySport: z.string().default("OTHER"),
  recentSessionCount: z.number().int().min(0).default(0),
  sessionsBySport: z.record(z.string(), z.number()).default({}),
  completedSessionCount: z.number().int().min(0).default(0),
});

// GET /api/social/missions?userId=...
socialRouter.get("/missions", async (request, response) => {
  const userId = request.query["userId"] as string;
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const [missions, totalPoints] = await Promise.all([
      getUserMissions(userId),
      getTotalPoints(userId),
    ]);
    response.json({ missions, totalPoints });
  } catch (error) {
    console.error("[social] GET /missions failed:", error);
    response.status(500).json({ error: "Failed to load missions" });
  }
});

// POST /api/social/missions/generate
socialRouter.post("/missions/generate", async (request, response) => {
  const body = z.object({ userId: z.string(), context: UserContextSchema }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    const missions = await generateAndSaveMissions(body.data.userId, body.data.context);
    response.json({ missions, totalPoints: 0 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[social] Mission generation failed:", detail);
    response.status(502).json({ error: "AI mission generation failed", detail });
  }
});

// PATCH /api/social/missions/:id/complete
socialRouter.patch("/missions/:id/complete", async (request, response) => {
  const { id } = request.params;
  const body = z.object({ userId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    const result = await toggleMissionComplete(id, body.data.userId);
    response.json(result);
  } catch (error) {
    console.error("[social] Toggle complete failed:", error);
    response.status(500).json({ error: "Failed to toggle mission" });
  }
});

// POST /api/social/missions/:id/regenerate
socialRouter.post("/missions/:id/regenerate", async (request, response) => {
  const { id } = request.params;
  const body = z.object({ userId: z.string(), context: UserContextSchema }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    const mission = await regenerateOneMission(id, body.data.userId, body.data.context);
    response.json({ mission });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[social] Regenerate failed:", detail);
    response.status(502).json({ error: "Mission regeneration failed", detail });
  }
});
