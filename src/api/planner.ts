export type PlannerSport = "RUNNING" | "GYM" | "CYCLING" | "MOBILITY" | "SWIMMING" | "OTHER";

export type PlannerProfile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  profile: {
    primarySport: PlannerSport;
    bio: string | null;
    timezone: string;
  };
};

export type RunningCompletedData = {
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
};

export type CyclingCompletedData = {
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
};

export type GymCompletedData = {
  exercisesCount: number;
  totalSets: number;
  totalLoadKg: number;
};

export type MobilityCompletedData = {
  durationMinutes: number;
  focusArea: string;
};

export type PlannerCompletedData =
  | RunningCompletedData
  | CyclingCompletedData
  | GymCompletedData
  | MobilityCompletedData;

export type PlannerSessionDto = {
  id: string;
  userId: string;
  title: string;
  sport: PlannerSport;
  startAt: string;
  endAt: string;
  notes: string | null;
  location: string | null;
  status: "PLANNED" | "COMPLETED" | "CANCELED";
  completedData: PlannerCompletedData | null;
  createdAt: string;
  updatedAt: string;
};

export type PlannerSessionPayload = {
  userId: string;
  title: string;
  sport: PlannerSport;
  startAt: string;
  endAt: string;
  notes?: string;
  location?: string;
  status?: "PLANNED" | "COMPLETED" | "CANCELED";
  completedData?: PlannerCompletedData;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchTestProfile() {
  return request<PlannerProfile>("/api/planner/test-profile");
}

export function fetchSessions(userId: string) {
  return request<PlannerSessionDto[]>(
    `/api/planner/sessions?userId=${encodeURIComponent(userId)}`,
  );
}

export function createPlannerSession(payload: PlannerSessionPayload) {
  return request<PlannerSessionDto>("/api/planner/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePlannerSession(sessionId: string, payload: Partial<PlannerSessionPayload>) {
  return request<PlannerSessionDto>(`/api/planner/sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePlannerSession(sessionId: string) {
  return request<void>(`/api/planner/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
