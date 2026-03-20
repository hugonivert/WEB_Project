import { Router } from "express";
import { z } from "zod";
import { getPerformanceDashboard } from "./performance.service.js";

export const performanceRouter = Router();

performanceRouter.get("/metrics", (_request, response) => {
  response.json({
    module: "performance",
    status: "ready",
    nextStep: "Implement metrics, aggregates, and analytics endpoints here.",
  });
});

const dashboardQuerySchema = z.object({
  userId: z.string().uuid(),
});

performanceRouter.get("/dashboard", async (request, response) => {
  const query = dashboardQuerySchema.parse(request.query);
  const dashboard = await getPerformanceDashboard(query.userId);
  response.json(dashboard);
});

