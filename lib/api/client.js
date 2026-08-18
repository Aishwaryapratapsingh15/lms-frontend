import { getAccessToken } from "./tokenStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Only AuthController checks this (on /auth/login and /auth/refresh) — every
// other controller (Leads/Users/Email) has no CSRF check, so it's fetched
// and attached only by lib/api/auth.js, not generically here.
export async function fetchCsrfToken() {
  const res = await fetch(`${API_BASE_URL}/auth/csrf`);
  const data = await res.json().catch(() => null);
  return data?.csrfToken ?? null;
}

// The one place that talks to the backend — every lib/api/*.js module routes
// through this. Auth is via `Authorization: Bearer` (no cookies at all), so
// there's no `credentials: "include"` needed.
export async function apiFetch(path, { method = "GET", body, headers: extraHeaders } = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? res.statusText, data);
  return data;
}

// List endpoints return bare arrays in this backend (Prisma findMany
// results) — kept defensive in case that ever changes.
export function unwrapList(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}
