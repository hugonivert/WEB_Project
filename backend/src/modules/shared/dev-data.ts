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
];
