import { apiFetch, fetchCsrfToken } from "./client";
import { setSession, getRefreshToken, clearSession } from "./tokenStore";
import { decodeJwt } from "../jwt";
import { parseTtlToMs } from "../duration";

function buildUser(accessToken) {
  const claims = decodeJwt(accessToken);
  if (!claims) return null;
  return { id: claims.sub, email: claims.email, role: claims.role, name: claims.name };
}

export async function login(email, password) {
  const csrfToken = await fetchCsrfToken();
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
    headers: { "x-csrf-token": csrfToken },
  });
  setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + parseTtlToMs(data.expiresIn),
  });
  return buildUser(data.accessToken);
}

// Rotates the access + refresh tokens. Only works while the current access
// token is still valid — the backend's /auth/refresh requires it via
// JwtAuthGuard (see jwt.strategy.ts, ignoreExpiration: false) — so this is
// for proactively extending a live session, not recovering an expired one.
export async function refresh() {
  const csrfToken = await fetchCsrfToken();
  const data = await apiFetch("/auth/refresh", {
    method: "POST",
    headers: { "x-refresh-token": getRefreshToken(), "x-csrf-token": csrfToken },
  });
  setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + parseTtlToMs(data.expiresIn),
  });
  return data.accessToken;
}

export function logout() {
  clearSession();
}

export { buildUser as userFromAccessToken };
