// The backend has no cookie-based auth at all — access/refresh tokens travel
// as explicit headers and response-body fields (see auth.controller.ts).
// Persisted to sessionStorage (tab-scoped, cleared on tab close) so a page
// reload doesn't force a re-login mid-session; a longer-lived store like
// localStorage would widen the XSS exposure window for not much UX gain,
// since the access token is short-lived (15m default) regardless.
const STORAGE_KEY = "lms_session";

let accessToken = null;
let refreshToken = null;
let expiresAt = null; // epoch ms

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function getExpiresAt() {
  return expiresAt;
}

export function setSession({ accessToken: at, refreshToken: rt, expiresAt: exp }) {
  accessToken = at ?? null;
  refreshToken = rt ?? null;
  expiresAt = exp ?? null;

  if (typeof window === "undefined") return;
  if (accessToken && refreshToken) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken, expiresAt }));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function clearSession() {
  setSession({});
}

// Called once on app load. Returns the restored session, or null if there
// was nothing to restore (never persisted, or the access token has already
// expired — the backend's /auth/refresh requires a still-valid access token,
// so an expired one can't be silently recovered either way).
export function loadPersistedSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    accessToken = parsed.accessToken;
    refreshToken = parsed.refreshToken;
    expiresAt = parsed.expiresAt;
    return parsed;
  } catch {
    return null;
  }
}
