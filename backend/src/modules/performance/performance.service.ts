import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { SessionStatus, SportType } from "../../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { DEV_PROFILE, devSessionsStore } from "../shared/dev-data.js";

type TrendPoint = {
  label: string;
  runningKm: number;
  cyclingKm: number;
};

type DeltaValue = {
  absolute: number;
  percent: number | null;
};

type DistanceSummary = {
  sessions: number;
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  avgPaceMinPerKm: number | null;
  avgSpeedKmH: number | null;
  distanceDelta: DeltaValue | null;
};

type GymSummary = {
  sessions: number;
  totalSets: number;
  totalLoadKg: number;
  avgLoadKgPerSession: number;
  maxLoadKgPerSession: number;
  totalLoadDelta: DeltaValue | null;
};

type MobilitySummary = {
  sessions: number;
  durationMinutes: number;
  avgDurationMinutes: number;
  topFocusArea: string | null;
  durationDelta: DeltaValue | null;
};

export type PerformanceDashboard = {
  userId: string;
  generatedAt: string;
  weekly: {
    startAt: string;
    endAt: string;
    running: DistanceSummary;
    cycling: DistanceSummary;
    gym: GymSummary;
    mobility: MobilitySummary;
  };
  monthly: {
    startAt: string;
    endAt: string;
    running: DistanceSummary;
    cycling: DistanceSummary;
    gym: GymSummary;
    mobility: MobilitySummary;
  };
  cumulative: {
    startAt: string | null;
    endAt: string;
    running: DistanceSummary;
    cycling: DistanceSummary;
    gym: GymSummary;
    mobility: MobilitySummary;
  };
  trends: {
    weeklyDistance: TrendPoint[];
    monthlyDistance: TrendPoint[];
  };
};

type CompletedSession = {
  sport: SportType;
  status: SessionStatus;
  startAt: Date;
  completedData: unknown;
};

type DateWindow = {
  start: Date;
  end: Date;
};

const canFallback = (error: unknown) =>
  error instanceof PrismaClientKnownRequestError && error.code === "P1001";

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function delta(currentValue: number, previousValue: number): DeltaValue {
  const absolute = round(currentValue - previousValue);
  if (previousValue <= 0) {
    return { absolute, percent: null };
  }

  return { absolute, percent: round(((currentValue - previousValue) / previousValue) * 100) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDistanceData(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const distanceKm = value.distanceKm;
  const durationMinutes = value.durationMinutes;
  const elevationGainM = value.elevationGainM;

  if (
    typeof distanceKm !== "number" ||
    typeof durationMinutes !== "number" ||
    typeof elevationGainM !== "number"
  ) {
    return null;
  }

  return {
    distanceKm,
    durationMinutes,
    elevationGainM,
  };
}

function parseGymData(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const totalSets = value.totalSets;
  const totalLoadKg = value.totalLoadKg;

  if (typeof totalSets !== "number" || typeof totalLoadKg !== "number") {
    return null;
  }

  return {
    totalSets,
    totalLoadKg,
  };
}

function parseMobilityData(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const durationMinutes = value.durationMinutes;
  const focusArea = value.focusArea;

  if (typeof durationMinutes !== "number" || typeof focusArea !== "string") {
    return null;
  }

  return {
    durationMinutes,
    focusArea,
  };
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function inWindow(date: Date, window: DateWindow) {
  return date >= window.start && date < window.end;
}

function filterSessionsByWindow(sessions: CompletedSession[], window: DateWindow) {
  return sessions.filter((session) => inWindow(session.startAt, window));
}

function aggregateDistanceSummary(
  sessions: CompletedSession[],
  sport: "RUNNING" | "CYCLING",
  previousSessions?: CompletedSession[],
): DistanceSummary {
  const values = sessions
    .filter((session) => session.sport === sport)
    .map((session) => parseDistanceData(session.completedData))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const distanceKm = round(values.reduce((acc, entry) => acc + entry.distanceKm, 0), 2);
  const durationMinutes = round(values.reduce((acc, entry) => acc + entry.durationMinutes, 0));
  const elevationGainM = round(values.reduce((acc, entry) => acc + entry.elevationGainM, 0));

  const avgPaceMinPerKm =
    distanceKm > 0 ? round(durationMinutes / distanceKm, 2) : null;
  const avgSpeedKmH =
    durationMinutes > 0 ? round((distanceKm / durationMinutes) * 60, 2) : null;

  let distanceDelta: DeltaValue | null = null;
  if (previousSessions) {
    const previousDistance = previousSessions
      .filter((session) => session.sport === sport)
      .map((session) => parseDistanceData(session.completedData))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .reduce((acc, entry) => acc + entry.distanceKm, 0);
    distanceDelta = delta(distanceKm, previousDistance);
  }

  return {
    sessions: values.length,
    distanceKm,
    durationMinutes,
    elevationGainM,
    avgPaceMinPerKm,
    avgSpeedKmH,
    distanceDelta,
  };
}

function aggregateGymSummary(
  sessions: CompletedSession[],
  previousSessions?: CompletedSession[],
): GymSummary {
  const values = sessions
    .filter((session) => session.sport === SportType.GYM)
    .map((session) => parseGymData(session.completedData))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const totalSets = round(values.reduce((acc, entry) => acc + entry.totalSets, 0));
  const totalLoadKg = round(values.reduce((acc, entry) => acc + entry.totalLoadKg, 0), 2);
  const maxLoadKgSession = values.length
    ? round(Math.max(...values.map((entry) => entry.totalLoadKg)), 2)
    : 0;
  const avgLoadKgPerSession = values.length ? round(totalLoadKg / values.length, 2) : 0;

  let totalLoadDelta: DeltaValue | null = null;
  if (previousSessions) {
    const previousLoad = previousSessions
      .filter((session) => session.sport === SportType.GYM)
      .map((session) => parseGymData(session.completedData))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .reduce((acc, entry) => acc + entry.totalLoadKg, 0);
    totalLoadDelta = delta(totalLoadKg, previousLoad);
  }

  return {
    sessions: values.length,
    totalSets,
    totalLoadKg,
    avgLoadKgPerSession,
    maxLoadKgPerSession: maxLoadKgSession,
    totalLoadDelta,
  };
}

function aggregateMobilitySummary(
  sessions: CompletedSession[],
  previousSessions?: CompletedSession[],
): MobilitySummary {
  const values = sessions
    .filter((session) => session.sport === SportType.MOBILITY)
    .map((session) => parseMobilityData(session.completedData))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const durationMinutes = round(values.reduce((acc, entry) => acc + entry.durationMinutes, 0));
  const avgDurationMinutes = values.length ? round(durationMinutes / values.length, 2) : 0;

  const focusAreas = new Map<string, number>();
  for (const value of values) {
    focusAreas.set(value.focusArea, (focusAreas.get(value.focusArea) ?? 0) + 1);
  }

  let topFocusArea: string | null = null;
  let topFocusCount = 0;
  for (const [focusArea, count] of focusAreas.entries()) {
    if (count > topFocusCount) {
      topFocusArea = focusArea;
      topFocusCount = count;
    }
  }

  let durationDelta: DeltaValue | null = null;
  if (previousSessions) {
    const previousDuration = previousSessions
      .filter((session) => session.sport === SportType.MOBILITY)
      .map((session) => parseMobilityData(session.completedData))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .reduce((acc, entry) => acc + entry.durationMinutes, 0);
    durationDelta = delta(durationMinutes, previousDuration);
  }

  return {
    sessions: values.length,
    durationMinutes,
    avgDurationMinutes,
    topFocusArea,
    durationDelta,
  };
}

function weeklyDistanceTrend(sessions: CompletedSession[], now: Date): TrendPoint[] {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const currentWeekStart = getWeekStart(now);

  return Array.from({ length: 10 }, (_, index) => {
    const offset = 9 - index;
    const start = addDays(currentWeekStart, -7 * offset);
    const end = addDays(start, 7);
    const windowSessions = filterSessionsByWindow(sessions, { start, end });

    const runningKm = round(
      windowSessions
        .filter((session) => session.sport === SportType.RUNNING)
        .map((session) => parseDistanceData(session.completedData))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .reduce((acc, entry) => acc + entry.distanceKm, 0),
      2,
    );

    const cyclingKm = round(
      windowSessions
        .filter((session) => session.sport === SportType.CYCLING)
        .map((session) => parseDistanceData(session.completedData))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .reduce((acc, entry) => acc + entry.distanceKm, 0),
      2,
    );

    return {
      label: formatter.format(start),
      runningKm,
      cyclingKm,
    };
  });
}

function monthlyDistanceTrend(sessions: CompletedSession[], now: Date): TrendPoint[] {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });
  const currentMonthStart = getMonthStart(now);

  return Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const start = addMonths(currentMonthStart, -offset);
    const end = addMonths(start, 1);
    const windowSessions = filterSessionsByWindow(sessions, { start, end });

    const runningKm = round(
      windowSessions
        .filter((session) => session.sport === SportType.RUNNING)
        .map((session) => parseDistanceData(session.completedData))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .reduce((acc, entry) => acc + entry.distanceKm, 0),
      2,
    );

    const cyclingKm = round(
      windowSessions
        .filter((session) => session.sport === SportType.CYCLING)
        .map((session) => parseDistanceData(session.completedData))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .reduce((acc, entry) => acc + entry.distanceKm, 0),
      2,
    );

    return {
      label: formatter.format(start),
      runningKm,
      cyclingKm,
    };
  });
}

async function listCompletedSessions(userId: string): Promise<CompletedSession[]> {
  try {
    return await prisma.trainingSession.findMany({
      where: {
        userId,
        status: SessionStatus.COMPLETED,
      },
      select: {
        sport: true,
        status: true,
        startAt: true,
        completedData: true,
      },
      orderBy: {
        startAt: "asc",
      },
    });
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }

    return devSessionsStore
      .filter((session) => session.userId === userId && session.status === SessionStatus.COMPLETED)
      .map((session) => ({
        sport: session.sport,
        status: session.status,
        startAt: new Date(session.startAt),
        completedData: session.completedData,
      }))
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }
}

export async function resolvePerformanceUserId(inputUserId?: string) {
  if (inputUserId) {
    return inputUserId;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: DEV_PROFILE.email },
      select: { id: true },
    });
    return user?.id ?? DEV_PROFILE.id;
  } catch (error) {
    if (!canFallback(error)) {
      throw error;
    }
    return DEV_PROFILE.id;
  }
}

export async function getPerformanceDashboard(userId: string): Promise<PerformanceDashboard> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const nextWeekStart = addDays(weekStart, 7);
  const previousWeekStart = addDays(weekStart, -7);

  const monthStart = getMonthStart(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const previousMonthStart = addMonths(monthStart, -1);

  const sessions = await listCompletedSessions(userId);

  const weeklySessions = filterSessionsByWindow(sessions, {
    start: weekStart,
    end: nextWeekStart,
  });
  const previousWeeklySessions = filterSessionsByWindow(sessions, {
    start: previousWeekStart,
    end: weekStart,
  });

  const monthlySessions = filterSessionsByWindow(sessions, {
    start: monthStart,
    end: nextMonthStart,
  });
  const previousMonthlySessions = filterSessionsByWindow(sessions, {
    start: previousMonthStart,
    end: monthStart,
  });

  const cumulativeStart = sessions.length ? sessions[0].startAt : null;

  return {
    userId,
    generatedAt: now.toISOString(),
    weekly: {
      startAt: weekStart.toISOString(),
      endAt: nextWeekStart.toISOString(),
      running: aggregateDistanceSummary(
        weeklySessions,
        SportType.RUNNING,
        previousWeeklySessions,
      ),
      cycling: aggregateDistanceSummary(
        weeklySessions,
        SportType.CYCLING,
        previousWeeklySessions,
      ),
      gym: aggregateGymSummary(weeklySessions, previousWeeklySessions),
      mobility: aggregateMobilitySummary(weeklySessions, previousWeeklySessions),
    },
    monthly: {
      startAt: monthStart.toISOString(),
      endAt: nextMonthStart.toISOString(),
      running: aggregateDistanceSummary(
        monthlySessions,
        SportType.RUNNING,
        previousMonthlySessions,
      ),
      cycling: aggregateDistanceSummary(
        monthlySessions,
        SportType.CYCLING,
        previousMonthlySessions,
      ),
      gym: aggregateGymSummary(monthlySessions, previousMonthlySessions),
      mobility: aggregateMobilitySummary(monthlySessions, previousMonthlySessions),
    },
    cumulative: {
      startAt: cumulativeStart?.toISOString() ?? null,
      endAt: now.toISOString(),
      running: aggregateDistanceSummary(sessions, SportType.RUNNING),
      cycling: aggregateDistanceSummary(sessions, SportType.CYCLING),
      gym: aggregateGymSummary(sessions),
      mobility: aggregateMobilitySummary(sessions),
    },
    trends: {
      weeklyDistance: weeklyDistanceTrend(sessions, now),
      monthlyDistance: monthlyDistanceTrend(sessions, now),
    },
  };
}
