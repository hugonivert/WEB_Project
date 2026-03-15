import { Router } from "express";

export const performanceRouter = Router();

performanceRouter.get("/metrics", (_request, response) => {
  response.json({
    module: "performance",
    status: "ready",
    nextStep: "Implement metrics, aggregates, and analytics endpoints here.",
  });
});

