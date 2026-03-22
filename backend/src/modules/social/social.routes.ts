import { Router } from "express";
import { z } from "zod";
import {
  getFriends,
  getFriendSuggestions,
  searchUsers,
  addFriend,
  removeFriend,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getPendingRequests,
  getSentRequests,
  getUserProfile,
  getUserMissions,
  generateAndSaveMissions,
  toggleMissionComplete,
  regenerateOneMission,
  getTotalPoints,
  getFeed,
  getLeaderboard,
} from "./social.service.js";

export const socialRouter = Router();

// GET /api/social/posts?userId=...
socialRouter.get("/posts", async (request, response) => {
  const userId = request.query["userId"] as string;
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const posts = await getFeed(userId);
    response.json({ posts });
  } catch (error) {
    console.error("[social] GET /posts failed:", error);
    response.status(500).json({ error: "Failed to load feed" });
  }
});

// GET /api/social/friends?userId=...
socialRouter.get("/friends", async (request, response) => {
  const userId = request.query["userId"] as string;
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const friends = await getFriends(userId);
    response.json({ friends });
  } catch (error) {
    console.error("[social] GET /friends failed:", error);
    response.status(500).json({ error: "Failed to load friends" });
  }
});

// GET /api/social/friend-suggestions?userId=...
socialRouter.get("/friend-suggestions", async (request, response) => {
  const userId = request.query["userId"] as string;
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const suggestions = await getFriendSuggestions(userId);
    response.json({ suggestions });
  } catch (error) {
    console.error("[social] GET /friend-suggestions failed:", error);
    response.status(500).json({ error: "Failed to load friend suggestions" });
  }
});

// POST /api/social/friends
socialRouter.post("/friends", async (request, response) => {
  const body = z.object({ userId: z.string(), friendId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    const friend = await addFriend(body.data.userId, body.data.friendId);
    response.status(201).json({ friend });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to add friend";
    response.status(400).json({ error: detail });
  }
});

// GET /api/social/users/search?userId=&q=
socialRouter.get("/users/search", async (request, response) => {
  const userId = request.query["userId"] as string;
  const q = (request.query["q"] as string) ?? "";
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const results = await searchUsers(userId, q);
    response.json({ results });
  } catch (error) {
    console.error("[social] GET /users/search failed:", error);
    response.status(500).json({ error: "Search failed" });
  }
});

// DELETE /api/social/friends
socialRouter.delete("/friends", async (request, response) => {
  const body = z.object({ userId: z.string(), friendId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    await removeFriend(body.data.userId, body.data.friendId);
    response.status(204).send();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to remove friend";
    response.status(400).json({ error: detail });
  }
});

// GET /api/social/friend-requests/pending?userId=...
socialRouter.get("/friend-requests/pending", async (request, response) => {
  const userId = request.query["userId"] as string;
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const requests = await getPendingRequests(userId);
    response.json({ requests });
  } catch (error) {
    console.error("[social] GET /friend-requests/pending failed:", error);
    response.status(500).json({ error: "Failed to load pending requests" });
  }
});

// POST /api/social/friend-requests
socialRouter.post("/friend-requests", async (request, response) => {
  const body = z.object({ senderId: z.string(), receiverId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    const req = await sendFriendRequest(body.data.senderId, body.data.receiverId);
    response.status(201).json({ request: req });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to send friend request";
    response.status(400).json({ error: detail });
  }
});

// PATCH /api/social/friend-requests/:id/accept
socialRouter.patch("/friend-requests/:id/accept", async (request, response) => {
  const { id } = request.params;
  const body = z.object({ userId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    const friend = await acceptFriendRequest(id, body.data.userId);
    response.json({ friend });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to accept request";
    response.status(400).json({ error: detail });
  }
});

// GET /api/social/friend-requests/sent?userId=...
socialRouter.get("/friend-requests/sent", async (request, response) => {
  const userId = request.query["userId"] as string;
  if (!userId) { response.status(400).json({ error: "userId is required" }); return; }
  try {
    const requests = await getSentRequests(userId);
    response.json({ requests });
  } catch (error) {
    console.error("[social] GET /friend-requests/sent failed:", error);
    response.status(500).json({ error: "Failed to load sent requests" });
  }
});

// DELETE /api/social/friend-requests/:id
socialRouter.delete("/friend-requests/:id", async (request, response) => {
  const { id } = request.params;
  const body = z.object({ userId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    await cancelFriendRequest(id, body.data.userId);
    response.status(204).send();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to cancel request";
    response.status(400).json({ error: detail });
  }
});

// PATCH /api/social/friend-requests/:id/reject
socialRouter.patch("/friend-requests/:id/reject", async (request, response) => {
  const { id } = request.params;
  const body = z.object({ userId: z.string() }).safeParse(request.body);
  if (!body.success) { response.status(400).json({ error: body.error.flatten() }); return; }
  try {
    await rejectFriendRequest(id, body.data.userId);
    response.status(204).send();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to reject request";
    response.status(400).json({ error: detail });
  }
});

// GET /api/social/profile/:userId
socialRouter.get("/profile/:userId", async (request, response) => {
  const { userId } = request.params;
  try {
    const profile = await getUserProfile(userId);
    response.json(profile);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Failed to load profile";
    response.status(404).json({ error: detail });
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
