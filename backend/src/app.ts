import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { apiRouter } from "./modules/index.js";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    message: "Athlete backend is running",
    docs: {
      health: "/api/health",
      users: "/api/users",
      planner: "/api/planner/sessions",
      performance: "/api/performance/metrics",
      social: "/api/social/posts",
      avatar: "/api/avatar/inventory",
      auth: "/api/auth/status",
    },
  });
});

app.use("/api", apiRouter);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation error",
      issues: error.issues,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    message: "Internal server error",
  });
});
