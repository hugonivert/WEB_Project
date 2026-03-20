import { SessionStatus, SportType } from "../generated/prisma/enums.js";
import { prisma } from "../backend/src/lib/prisma.js";

const at = (dayOffset: number, hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

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
    update: {
      title: "Threshold Run",
      sport: SportType.RUNNING,
      status: SessionStatus.PLANNED,
      startAt: at(0, 18, 0),
      endAt: at(0, 19, 0),
      notes: "4 x 8 min at threshold pace",
      location: "Track",
    },
    create: {
      id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa001",
      userId: plannerUser.id,
      title: "Threshold Run",
      sport: SportType.RUNNING,
      status: SessionStatus.PLANNED,
      startAt: at(0, 18, 0),
      endAt: at(0, 19, 0),
      notes: "4 x 8 min at threshold pace",
      location: "Track",
    },
  });

  const maya = await prisma.user.upsert({
    where: {
      email: "maya.laurent@athlete.local",
    },
    update: {},
    create: {
      email: "maya.laurent@athlete.local",
      displayName: "Maya Laurent",
      profile: {
        create: {
          primarySport: SportType.RUNNING,
          timezone: "Europe/Paris",
          bio: "Road runner and occasional trail runner.",
        },
      },
    },
  });

  const noah = await prisma.user.upsert({
    where: {
      email: "noah.martin@athlete.local",
    },
    update: {},
    create: {
      email: "noah.martin@athlete.local",
      displayName: "Noah Martin",
      profile: {
        create: {
          primarySport: SportType.CYCLING,
          timezone: "Europe/Paris",
          bio: "Cycling addict, mostly endurance rides.",
        },
      },
    },
  });

  const lina = await prisma.user.upsert({
    where: {
      email: "lina.dupont@athlete.local",
    },
    update: {},
    create: {
      email: "lina.dupont@athlete.local",
      displayName: "Lina Dupont",
      profile: {
        create: {
          primarySport: SportType.GYM,
          timezone: "Europe/Paris",
          bio: "Strength athlete focused on consistency.",
        },
      },
    },
  });

  await prisma.trainingSession.upsert({
    where: {
      id: "d145ca78-c0b5-4d7c-8d86-6d33db5fa101",
    },
    update: {
      title: "Tempo Run",
      sport: SportType.RUNNING,
      status: SessionStatus.COMPLETED,
      startAt: at(-6, 17, 30),
      endAt: at(-6, 18, 20),
      notes: "3 x 10 min at tempo pace",
      location: "Riverside loop",
      completedData: {
        distanceKm: 9.2,
        durationMinutes: 50,
        elevationGainM: 70,
      },
    },
    create: {
      id: "d145ca78-c0b5-4d7c-8d86-6d33db5fa101",
      userId: maya.id,
      title: "Tempo Run",
      sport: SportType.RUNNING,
      status: SessionStatus.COMPLETED,
      startAt: at(-6, 17, 30),
      endAt: at(-6, 18, 20),
      notes: "3 x 10 min at tempo pace",
      location: "Riverside loop",
      completedData: {
        distanceKm: 9.2,
        durationMinutes: 50,
        elevationGainM: 70,
      },
    },
  });

  await prisma.trainingSession.upsert({
    where: {
      id: "3e6f299f-977b-47fe-af80-abf61484f202",
    },
    update: {
      title: "Recovery Ride",
      sport: SportType.CYCLING,
      status: SessionStatus.COMPLETED,
      startAt: at(-5, 9, 0),
      endAt: at(-5, 10, 0),
      notes: "Easy cadence and low power",
      location: "City park",
      completedData: {
        distanceKm: 24.8,
        durationMinutes: 60,
        elevationGainM: 180,
      },
    },
    create: {
      id: "3e6f299f-977b-47fe-af80-abf61484f202",
      userId: noah.id,
      title: "Recovery Ride",
      sport: SportType.CYCLING,
      status: SessionStatus.COMPLETED,
      startAt: at(-5, 9, 0),
      endAt: at(-5, 10, 0),
      notes: "Easy cadence and low power",
      location: "City park",
      completedData: {
        distanceKm: 24.8,
        durationMinutes: 60,
        elevationGainM: 180,
      },
    },
  });

  await prisma.trainingSession.upsert({
    where: {
      id: "5f92d957-2080-4af5-a51a-e5be0777a303",
    },
    update: {
      title: "Upper Body Strength",
      sport: SportType.GYM,
      status: SessionStatus.COMPLETED,
      startAt: at(-5, 16, 0),
      endAt: at(-5, 17, 10),
      notes: "Bench + pull-up focus",
      location: "Athletic center",
      completedData: {
        exercisesCount: 6,
        totalSets: 18,
        totalLoadKg: 5420,
      },
    },
    create: {
      id: "5f92d957-2080-4af5-a51a-e5be0777a303",
      userId: lina.id,
      title: "Upper Body Strength",
      sport: SportType.GYM,
      status: SessionStatus.COMPLETED,
      startAt: at(-5, 16, 0),
      endAt: at(-5, 17, 10),
      notes: "Bench + pull-up focus",
      location: "Athletic center",
      completedData: {
        exercisesCount: 6,
        totalSets: 18,
        totalLoadKg: 5420,
      },
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
