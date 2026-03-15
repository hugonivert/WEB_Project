import { Router } from "express";

export const avatarRouter = Router();

avatarRouter.get("/inventory", (_request, response) => {
  response.json({
    module: "avatar",
    status: "ready",
    nextStep: "Implement avatar inventory, rewards, and progression endpoints here.",
  });
});

