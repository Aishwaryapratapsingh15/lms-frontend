import { apiFetch, fetchCsrfToken, refreshSession } from "./client";
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
    method: "POST", body: { email, password }, headers: { "x-csrf-token": csrfToken }, retryAuth: false,
  });
  setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: Date.now() + parseTtlToMs(data.expiresIn) });
  return buildUser(data.accessToken);
}

export const refresh = refreshSession;
export const forgotPassword = (email) => apiFetch("/auth/forgot-password", { method: "POST", body: { email }, retryAuth: false });
export const resetPassword = (token, newPassword) => apiFetch("/auth/reset-password", { method: "POST", body: { token, newPassword }, retryAuth: false });
export const changePassword = (currentPassword, newPassword) => apiFetch("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await apiFetch("/auth/logout", { method: "POST", headers: { "x-refresh-token": refreshToken }, retryAuth: false });
  } finally { clearSession(); }
}

export async function logoutAll() {
  try { await apiFetch("/auth/logout-all", { method: "POST" }); }
  finally { clearSession(); }
}

export { buildUser as userFromAccessToken };
