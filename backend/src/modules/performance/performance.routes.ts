import { Router } from "express";
import { z } from "zod";
import {
  getPerformanceDashboard,
  resolvePerformanceUserId,
} from "./performance.service.js";

export const performanceRouter = Router();

performanceRouter.get("/metrics", (_request, response) => {
  response.json({
    module: "performance",
    status: "ready",
    nextStep: "Implement metrics, aggregates, and analytics endpoints here.",
  });
});

const dashboardQuerySchema = z.object({
  userId: z.string().uuid().optional(),
});

performanceRouter.get("/dashboard", async (request, response) => {
  const query = dashboardQuerySchema.parse(request.query);
  const userId = await resolvePerformanceUserId(query.userId);
  const dashboard = await getPerformanceDashboard(userId);
  response.json(dashboard);
});

