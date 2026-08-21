// Access/refresh tokens live only in httpOnly cookies now — the frontend
// never sees them and has nothing sensitive to cache. This module just
// caches the non-sensitive display data (user info + access-token expiry)
// in sessionStorage so a page reload can render authenticated instantly
// instead of waiting on a GET /auth/me round trip; lib/AuthContext.js still
// re-validates against the backend in the background on mount.
const STORAGE_KEY = "lms_session";

let user = null;
let expiresAt = null; // epoch ms

export function getUser() {
  return user;
}

export function getExpiresAt() {
  return expiresAt;
}

export function setSession({ user: u, expiresAt: exp }) {
  user = u ?? null;
  expiresAt = exp ?? null;

  if (typeof window === "undefined") return;
  if (user && expiresAt) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, expiresAt }));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function clearSession() {
  setSession({});
}

export function loadPersistedSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    user = parsed.user;
    expiresAt = parsed.expiresAt;
    return parsed;
  } catch {
    return null;
  }
}
