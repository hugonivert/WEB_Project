export type SportType =
  | "RUNNING"
  | "GYM"
  | "CYCLING"
  | "MOBILITY"
  | "SWIMMING"
  | "OTHER";

export type MissionDto = {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  sport: SportType;
  rewardPoints: number;
  targetSessions: number;
  completed: boolean;
  completedAt: string | null;
};

export type MissionsResponse = {
  missions: MissionDto[];
  totalPoints: number;
};

export type UserContext = {
  primarySport: SportType;
  recentSessionCount: number;
  sessionsBySport: Partial<Record<SportType, number>>;
  completedSessionCount: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export type FeedPostDto = {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  sport: SportType;
  createdAt: string;
};

export type FriendDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  friendshipCreatedAt: string;
};

export type FriendSuggestionDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  primarySport: SportType;
  completedSessions: number;
  requestStatus?: "none" | "pending_sent" | "pending_received";
};

export type FriendRequestDto = {
  id: string;
  senderId: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  createdAt: string;
};

export type UserProfileDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  recentAchievements: Array<{
    id: string;
    title: string;
    sport: SportType;
    rewardPoints: number;
    completedAt: string;
  }>;
};

export type LeaderboardEntryDto = {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
};

export function fetchFeed(userId: string) {
  return request<{ posts: FeedPostDto[] }>(`/api/social/posts?userId=${encodeURIComponent(userId)}`);
}

export function fetchFriends(userId: string) {
  return request<{ friends: FriendDto[] }>(`/api/social/friends?userId=${encodeURIComponent(userId)}`);
}

export function fetchFriendSuggestions(userId: string) {
  return request<{ suggestions: FriendSuggestionDto[] }>(
    `/api/social/friend-suggestions?userId=${encodeURIComponent(userId)}`,
  );
}

export function addFriend(userId: string, friendId: string) {
  return request<{ friend: FriendDto }>("/api/social/friends", {
    method: "POST",
    body: JSON.stringify({ userId, friendId }),
  });
}

export function fetchLeaderboard() {
  return request<{ entries: LeaderboardEntryDto[] }>("/api/social/leaderboard");
}

export function fetchMissions(userId: string) {
  return request<MissionsResponse>(`/api/social/missions?userId=${encodeURIComponent(userId)}`);
}

export function generateMissions(userId: string, context: UserContext) {
  return request<MissionsResponse>("/api/social/missions/generate", {
    method: "POST",
    body: JSON.stringify({ userId, context }),
  });
}

export function toggleMissionComplete(missionId: string, userId: string) {
  return request<{ mission: MissionDto; totalPoints: number }>(
    `/api/social/missions/${missionId}/complete`,
    { method: "PATCH", body: JSON.stringify({ userId }) },
  );
}

export function regenerateMission(missionId: string, userId: string, context: UserContext) {
  return request<{ mission: MissionDto }>(
    `/api/social/missions/${missionId}/regenerate`,
    { method: "POST", body: JSON.stringify({ userId, context }) },
  );
}

export function removeFriend(userId: string, friendId: string) {
  return request<void>("/api/social/friends", {
    method: "DELETE",
    body: JSON.stringify({ userId, friendId }),
  });
}

export function sendFriendRequest(senderId: string, receiverId: string) {
  return request<{ request: FriendRequestDto }>("/api/social/friend-requests", {
    method: "POST",
    body: JSON.stringify({ senderId, receiverId }),
  });
}

export function acceptFriendRequest(requestId: string, userId: string) {
  return request<{ friend: FriendDto }>(`/api/social/friend-requests/${requestId}/accept`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });
}

export function rejectFriendRequest(requestId: string, userId: string) {
  return request<void>(`/api/social/friend-requests/${requestId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });
}

export function fetchPendingRequests(userId: string) {
  return request<{ requests: FriendRequestDto[] }>(
    `/api/social/friend-requests/pending?userId=${encodeURIComponent(userId)}`,
  );
}

export function fetchSentRequests(userId: string) {
  return request<{ requests: FriendRequestDto[] }>(
    `/api/social/friend-requests/sent?userId=${encodeURIComponent(userId)}`,
  );
}

export function cancelFriendRequest(requestId: string, userId: string) {
  return request<void>(`/api/social/friend-requests/${requestId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export function fetchUserProfile(userId: string) {
  return request<UserProfileDto>(`/api/social/profile/${encodeURIComponent(userId)}`);
}

export function searchUsers(userId: string, query: string) {
  return request<{ results: FriendSuggestionDto[] }>(
    `/api/social/users/search?userId=${encodeURIComponent(userId)}&q=${encodeURIComponent(query)}`,
  );
}
