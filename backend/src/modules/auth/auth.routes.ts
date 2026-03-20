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
  // NOTE: Mock token used to wire the frontend. Replace with JWT/cookies.
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
  try {
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
  } catch (error) {
    console.error("[auth] POST /signup failed:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes("Zod")) {
      response.status(400).json({ message: error.message });
    } else {
      response.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : undefined });
    }
  }
});

authRouter.post("/login", async (request, response) => {
  try {
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
  } catch (error) {
    console.error("[auth] POST /login failed:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes("Zod")) {
      response.status(400).json({ message: error.message });
    } else {
      response.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : undefined });
    }
  }
});
