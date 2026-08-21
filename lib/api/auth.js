import { apiFetch, refreshSession } from "./client";
import { setSession, clearSession } from "./session";
import { parseTtlToMs } from "../duration";

export async function login(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST", body: { email, password }, retryAuth: false,
  });
  setSession({ user: data.user, expiresAt: Date.now() + parseTtlToMs(data.expiresIn) });
  return data.user;
}

export const refresh = refreshSession;
export const me = () => apiFetch("/auth/me", { retryAuth: false });
export const forgotPassword = (email) => apiFetch("/auth/forgot-password", { method: "POST", body: { email }, retryAuth: false });
export const resetPassword = (token, newPassword) => apiFetch("/auth/reset-password", { method: "POST", body: { token, newPassword }, retryAuth: false });
export const changePassword = (currentPassword, newPassword) => apiFetch("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST", retryAuth: false });
  } finally { clearSession(); }
}

export async function logoutAll() {
  try { await apiFetch("/auth/logout-all", { method: "POST" }); }
  finally { clearSession(); }
}
