export type DeltaValue = {
  absolute: number;
  percent: number | null;
};

export type DistanceSummary = {
  sessions: number;
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  avgPaceMinPerKm: number | null;
  avgSpeedKmH: number | null;
  distanceDelta: DeltaValue | null;
};

export type GymSummary = {
  sessions: number;
  totalSets: number;
  totalLoadKg: number;
  avgLoadKgPerSession: number;
  maxLoadKgSession: number;
  totalLoadDelta: DeltaValue | null;
};

export type MobilitySummary = {
  sessions: number;
  durationMinutes: number;
  avgDurationMinutes: number;
  topFocusArea: string | null;
  durationDelta: DeltaValue | null;
};

export type TrendPoint = {
  label: string;
  runningKm: number;
  cyclingKm: number;
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

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchPerformanceDashboard(userId: string) {
  const query = `?userId=${encodeURIComponent(userId)}`;
  return request<PerformanceDashboard>(`/api/performance/dashboard${query}`);
}
