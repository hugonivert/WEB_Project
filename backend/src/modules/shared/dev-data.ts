import { SessionStatus, SportType } from "../../../../generated/prisma/enums.js";

const toIsoAt = (dayOffset: number, hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const DEV_PROFILE: {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    userId: string;
    primarySport: SportType;
    bio: string;
    timezone: string;
    age: number;
    heightCm: number;
    weightKg: number;
    createdAt: string;
    updatedAt: string;
  };
} = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "planner.demo@athlete.local",
  displayName: "Planner Demo",
  avatarUrl: null,
  createdAt: toIsoAt(-7, 8, 0),
  updatedAt: toIsoAt(-1, 8, 0),
  profile: {
    id: "22222222-2222-4222-8222-222222222222",
    userId: "11111111-1111-4111-8111-111111111111",
    primarySport: SportType.RUNNING,
    bio: "Testing profile for the planner page.",
    timezone: "Europe/Paris",
    age: 21,
    heightCm: 178,
    weightKg: 70.5,
    createdAt: toIsoAt(-7, 8, 0),
    updatedAt: toIsoAt(-1, 8, 0),
  },
};

export type DevSession = {
  id: string;
  userId: string;
  title: string;
  sport: keyof typeof SportType;
  startAt: string;
  endAt: string;
  notes: string | null;
  location: string | null;
  status: keyof typeof SessionStatus;
  completedData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export const devSessionsStore: DevSession[] = [
  {
    id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa001",
    userId: DEV_PROFILE.id,
    title: "Threshold Run",
    sport: SportType.RUNNING,
    startAt: toIsoAt(0, 18, 0),
    endAt: toIsoAt(0, 19, 0),
    notes: "4 x 8 min at threshold pace",
    location: "Track",
    status: SessionStatus.PLANNED,
    completedData: null,
    createdAt: toIsoAt(-7, 8, 0),
    updatedAt: toIsoAt(-1, 8, 0),
  },
  {
    id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa002",
    userId: DEV_PROFILE.id,
    title: "Upper Body Gym",
    sport: SportType.GYM,
    startAt: toIsoAt(1, 12, 30),
    endAt: toIsoAt(1, 13, 30),
    notes: "Push focus and accessories",
    location: "Fitness club",
    status: SessionStatus.PLANNED,
    completedData: null,
    createdAt: toIsoAt(-7, 8, 0),
    updatedAt: toIsoAt(-1, 8, 0),
  },
  {
    id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa003",
    userId: DEV_PROFILE.id,
    title: "Bike Intervals",
    sport: SportType.CYCLING,
    startAt: toIsoAt(3, 9, 0),
    endAt: toIsoAt(3, 10, 30),
    notes: "5 x 4 min threshold",
    location: "Outdoor loop",
    status: SessionStatus.PLANNED,
    completedData: null,
    createdAt: toIsoAt(-7, 8, 0),
    updatedAt: toIsoAt(-1, 8, 0),
  },
  {
    id: "d145ca78-c0b5-4d7c-8d86-6d33db5fa101",
    userId: "d33b0f82-5b8d-4f43-8f4f-9a533aa11111",
    title: "Tempo Run",
    sport: SportType.RUNNING,
    startAt: toIsoAt(-6, 17, 30),
    endAt: toIsoAt(-6, 18, 20),
    notes: "3 x 10 min at tempo pace",
    location: "Riverside loop",
    status: SessionStatus.COMPLETED,
    completedData: {
      distanceKm: 9.2,
      durationMinutes: 50,
      elevationGainM: 70,
    },
    createdAt: toIsoAt(-6, 18, 25),
    updatedAt: toIsoAt(-6, 18, 25),
  },
  {
    id: "3e6f299f-977b-47fe-af80-abf61484f202",
    userId: "cc7041b4-2d93-45df-850d-e3ab31e22222",
    title: "Recovery Ride",
    sport: SportType.CYCLING,
    startAt: toIsoAt(-5, 9, 0),
    endAt: toIsoAt(-5, 10, 0),
    notes: "Easy cadence and low power",
    location: "City park",
    status: SessionStatus.COMPLETED,
    completedData: {
      distanceKm: 24.8,
      durationMinutes: 60,
      elevationGainM: 180,
    },
    createdAt: toIsoAt(-5, 10, 5),
    updatedAt: toIsoAt(-5, 10, 5),
  },
  {
    id: "5f92d957-2080-4af5-a51a-e5be0777a303",
    userId: "f5b8f6dd-5a71-4681-8f8e-4741ccf33333",
    title: "Upper Body Strength",
    sport: SportType.GYM,
    startAt: toIsoAt(-5, 16, 0),
    endAt: toIsoAt(-5, 17, 10),
    notes: "Bench + pull-up focus",
    location: "Athletic center",
    status: SessionStatus.COMPLETED,
    completedData: {
      exercisesCount: 6,
      totalSets: 18,
      totalLoadKg: 5420,
    },
    createdAt: toIsoAt(-5, 17, 15),
    updatedAt: toIsoAt(-5, 17, 15),
  },
];
