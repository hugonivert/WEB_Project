export const AUTH_STORAGE_KEY = "fitquest_auth";

export type AuthSession = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  loggedInAt?: string;
};

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const maybe = parsed as Partial<AuthSession>;
    if (!maybe.token || typeof maybe.token !== "string") return null;
    if (!maybe.user || typeof maybe.user !== "object") return null;
    if (!maybe.user.email || typeof maybe.user.email !== "string") return null;

    return maybe as AuthSession;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return Boolean(readAuthSession());
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
