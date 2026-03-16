import { SessionStatus, SportType } from "../../../../generated/prisma/enums.js";

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
  createdAt: "2026-03-13T08:00:00.000Z",
  updatedAt: "2026-03-13T08:00:00.000Z",
  profile: {
    id: "22222222-2222-4222-8222-222222222222",
    userId: "11111111-1111-4111-8111-111111111111",
    primarySport: SportType.RUNNING,
    bio: "Testing profile for the planner page.",
    timezone: "Europe/Paris",
    age: 21,
    heightCm: 178,
    weightKg: 70.5,
    createdAt: "2026-03-13T08:00:00.000Z",
    updatedAt: "2026-03-13T08:00:00.000Z",
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
    startAt: "2026-03-16T18:00:00.000Z",
    endAt: "2026-03-16T19:00:00.000Z",
    notes: "4 x 8 min at threshold pace",
    location: "Track",
    status: SessionStatus.PLANNED,
    completedData: null,
    createdAt: "2026-03-13T08:00:00.000Z",
    updatedAt: "2026-03-13T08:00:00.000Z",
  },
  {
    id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa002",
    userId: DEV_PROFILE.id,
    title: "Upper Body Gym",
    sport: SportType.GYM,
    startAt: "2026-03-17T12:30:00.000Z",
    endAt: "2026-03-17T13:30:00.000Z",
    notes: "Push focus and accessories",
    location: "Fitness club",
    status: SessionStatus.PLANNED,
    completedData: null,
    createdAt: "2026-03-13T08:00:00.000Z",
    updatedAt: "2026-03-13T08:00:00.000Z",
  },
  {
    id: "b0c6a59c-7ed7-47f6-aa60-5d8e8d9fa003",
    userId: DEV_PROFILE.id,
    title: "Bike Intervals",
    sport: SportType.CYCLING,
    startAt: "2026-03-19T09:00:00.000Z",
    endAt: "2026-03-19T10:30:00.000Z",
    notes: "5 x 4 min threshold",
    location: "Outdoor loop",
    status: SessionStatus.PLANNED,
    completedData: null,
    createdAt: "2026-03-13T08:00:00.000Z",
    updatedAt: "2026-03-13T08:00:00.000Z",
  },
  {
    id: "d145ca78-c0b5-4d7c-8d86-6d33db5fa101",
    userId: "d33b0f82-5b8d-4f43-8f4f-9a533aa11111",
    title: "Tempo Run",
    sport: SportType.RUNNING,
    startAt: "2026-03-14T17:30:00.000Z",
    endAt: "2026-03-14T18:20:00.000Z",
    notes: "3 x 10 min at tempo pace",
    location: "Riverside loop",
    status: SessionStatus.COMPLETED,
    completedData: {
      distanceKm: 9.2,
      durationMinutes: 50,
      elevationGainM: 70,
    },
    createdAt: "2026-03-14T18:25:00.000Z",
    updatedAt: "2026-03-14T18:25:00.000Z",
  },
  {
    id: "3e6f299f-977b-47fe-af80-abf61484f202",
    userId: "cc7041b4-2d93-45df-850d-e3ab31e22222",
    title: "Recovery Ride",
    sport: SportType.CYCLING,
    startAt: "2026-03-15T09:00:00.000Z",
    endAt: "2026-03-15T10:00:00.000Z",
    notes: "Easy cadence and low power",
    location: "City park",
    status: SessionStatus.COMPLETED,
    completedData: {
      distanceKm: 24.8,
      durationMinutes: 60,
      elevationGainM: 180,
    },
    createdAt: "2026-03-15T10:05:00.000Z",
    updatedAt: "2026-03-15T10:05:00.000Z",
  },
  {
    id: "5f92d957-2080-4af5-a51a-e5be0777a303",
    userId: "f5b8f6dd-5a71-4681-8f8e-4741ccf33333",
    title: "Upper Body Strength",
    sport: SportType.GYM,
    startAt: "2026-03-15T16:00:00.000Z",
    endAt: "2026-03-15T17:10:00.000Z",
    notes: "Bench + pull-up focus",
    location: "Athletic center",
    status: SessionStatus.COMPLETED,
    completedData: {
      exercisesCount: 6,
      totalSets: 18,
      totalLoadKg: 5420,
    },
    createdAt: "2026-03-15T17:15:00.000Z",
    updatedAt: "2026-03-15T17:15:00.000Z",
  },
];
