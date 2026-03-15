import { Prisma } from "../../../../generated/prisma/client.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  profile: true,
} satisfies Prisma.UserSelect;

const createUserSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2).max(80),
  passwordHash: z.string().min(8).optional(),
  avatarUrl: z.string().url().optional(),
});

export const usersRouter = Router();

usersRouter.get("/", async (_request, response) => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: userSelect,
  });

  response.json(users);
});

usersRouter.post("/", async (request, response) => {
  const payload = createUserSchema.parse(request.body);

  const user = await prisma.user.create({
    data: payload,
    select: userSelect,
  });

  response.status(201).json(user);
});

