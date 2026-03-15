import { SessionStatus, SportType } from "../generated/prisma/enums.js";
import { prisma } from "../backend/src/lib/prisma.js";

async function main() {
  const plannerUser = await prisma.user.upsert({
    where: {
      email: "planner.demo@athlete.local",
    },
    update: {},
    create: {
      email: "planner.demo@athlete.local",
      displayName: "Planner Demo",
      profile: {
        create: {
          primarySport: SportType.RUNNING,
          timezone: "Europe/Paris",
          bio: "Seed user for planner testing.",
        },
      },
    },
  });

  await prisma.trainingSession.upsert({
    where: {
      id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa001",
    },
    update: {},
    create: {
      id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa001",
      userId: plannerUser.id,
      title: "Threshold Run",
      sport: SportType.RUNNING,
      status: SessionStatus.PLANNED,
      startAt: new Date("2026-03-16T18:00:00.000Z"),
      endAt: new Date("2026-03-16T19:00:00.000Z"),
      notes: "4 x 8 min at threshold pace",
      location: "Track",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
