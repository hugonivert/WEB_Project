export type AvatarProfileDto = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarProviderId: string | null;
  avatarPreviewUrl: string | null;
  unlocksEnabled: boolean;
  progression: {
    level: number;
    experiencePoints: number;
    streakDays: number;
  };
  cosmeticPolicy: {
    baseCatalog: string;
    lockedCatalogs: string[];
  };
  creatorPolicy: {
    targetMode: string;
    allowedAtSignup: string[];
    lockedAtSignup: string[];
    providerConstraint: string;
  };
  runningProgress: {
    totalRunningKm: number;
    completedRuns: number;
  };
  unlockCatalog: {
    totalRunningKm: number;
    unlockedCount: number;
    nextUnlock: {
      id: string;
      title: string;
      description: string;
      rewardType: string;
      thresholdKm: number;
      currentKm: number;
      previousThresholdKm: number;
      remainingKm: number;
      progressPercent: number;
    } | null;
    availableOptions: {
      accessories: string[];
      clothing: string[];
      clothesColor: "all" | "locked";
      clothingGraphic: "all" | "locked";
      accessoriesColor: "all" | "locked";
    };
    lockedFields: string[];
  };
  unlockProgress: Array<{
    id: string;
    title: string;
    description: string;
    thresholdKm: number;
    rewardType: string;
    field: string;
    value: string;
    currentProgressKm: number;
    totalRunningKm: number;
    completedRuns: number;
    remainingKm: number;
    isUnlocked: boolean;
  }>;
};

export type AvatarInventoryItemDto = {
  id: string;
  name: string;
  category: "SKIN" | "BADGE" | "ACCESSORY" | "THEME";
  rarity: string | null;
  pricePoints: number;
};

export type AvatarInventoryDto = {
  equippedItemIds: string[];
  unlockedItems: AvatarInventoryItemDto[];
  futureSources: string[];
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

  return response.json() as Promise<T>;
}

export function fetchAvatarProfile(userId: string) {
  return request<AvatarProfileDto>(`/api/avatar/profile?userId=${encodeURIComponent(userId)}`);
}

export function updateAvatarProfile(userId: string, avatarUrl: string) {
  return request<AvatarProfileDto>("/api/avatar/profile", {
    method: "PUT",
    body: JSON.stringify({ userId, avatarUrl }),
  });
}

export function fetchAvatarInventory(userId: string) {
  return request<AvatarInventoryDto>(`/api/avatar/inventory?userId=${encodeURIComponent(userId)}`);
}
