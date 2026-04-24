import type { SessionUser } from "./mock-accounts";

const STORAGE_KEY = "savadli_session_v1";

export function loadSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
