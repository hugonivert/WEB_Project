import { Router } from "express";

export const authRouter = Router();

authRouter.get("/status", (_request, response) => {
  response.json({
    module: "auth",
    status: "ready",
    nextStep: "Implement login, session handling, and route protection here.",
  });
});

