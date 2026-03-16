import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  displayName: z.string().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

function buildMockToken(userId: string): string {
  // NOTE: Token mock pour brancher le front. À remplacer par JWT/cookies.
  const payload = JSON.stringify({ userId, iat: Date.now() });
  return Buffer.from(payload).toString("base64url");
}

authRouter.get("/status", (_request, response) => {
  response.json({
    module: "auth",
    status: "ready",
    nextStep: "Implement login, session handling, and route protection here.",
  });
});

authRouter.post("/signup", async (request, response) => {
  const payload = signupSchema.parse(request.body);

  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (existing) {
    response.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      displayName: payload.displayName,
      passwordHash,
    },
    select: { id: true, email: true, displayName: true, avatarUrl: true },
  });

  response.status(201).json({
    user,
    token: buildMockToken(user.id),
  });
});

authRouter.post("/login", async (request, response) => {
  const payload = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(payload.password, user.passwordHash);
  if (!ok) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;

  response.json({
    user: safeUser,
    token: buildMockToken(user.id),
  });
});
