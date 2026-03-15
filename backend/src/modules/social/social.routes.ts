import { Router } from "express";

export const socialRouter = Router();

socialRouter.get("/posts", (_request, response) => {
  response.json({
    module: "social",
    status: "ready",
    nextStep: "Implement feed, challenges, and AI mission endpoints here.",
  });
});

