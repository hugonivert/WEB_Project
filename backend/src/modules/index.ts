import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { avatarRouter } from "./avatar/avatar.routes.js";
import { performanceRouter } from "./performance/performance.routes.js";
import { plannerRouter } from "./planner/planner.routes.js";
import { healthRouter } from "./shared/health.routes.js";
import { socialRouter } from "./social/social.routes.js";
import { usersRouter } from "./users/users.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/planner", plannerRouter);
apiRouter.use("/performance", performanceRouter);
apiRouter.use("/social", socialRouter);
apiRouter.use("/avatar", avatarRouter);

