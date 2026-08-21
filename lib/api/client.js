import { clearSession, setSession } from "./session";
import { readCsrfCookie } from "./csrf";
import { parseTtlToMs } from "../duration";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
let csrfPromise = null;
let refreshPromise = null;

export class ApiError extends Error {
  constructor(status, message, data, retryAfter = null) {
    super(Array.isArray(message) ? message.join(". ") : message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.retryAfter = retryAfter;
  }
}

function apiUrl(path) {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  return `${API_BASE_URL}${path}`;
}

export async function fetchCsrfToken() {
  if (!csrfPromise) {
    csrfPromise = fetch(apiUrl("/auth/csrf"), { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new ApiError(res.status, data?.message ?? res.statusText, data);
        return readCsrfCookie() ?? data?.csrfToken ?? null;
      })
      .finally(() => { csrfPromise = null; });
  }
  return csrfPromise;
}

async function ensureCsrfToken() {
  return readCsrfCookie() ?? (await fetchCsrfToken());
}

async function parseResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? res.statusText, data, res.headers.get("Retry-After"));
  return data;
}

export async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const csrfToken = await ensureCsrfToken();
    const res = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    });
    const data = await parseResponse(res);
    setSession({ user: data.user, expiresAt: Date.now() + parseTtlToMs(data.expiresIn) });
    return data;
  })().catch((error) => {
    clearSession();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("lms:unauthorized"));
    throw error;
  }).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function apiFetch(path, { method = "GET", body, headers: extraHeaders, retryAuth = true } = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (method !== "GET") headers["x-csrf-token"] = await ensureCsrfToken();
  const res = await fetch(apiUrl(path), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const cannotRefresh = ["/auth/login", "/auth/refresh", "/auth/forgot-password", "/auth/reset-password"].includes(path);
  if (res.status === 401 && retryAuth && !cannotRefresh) {
    await refreshSession();
    return apiFetch(path, { method, body, headers: extraHeaders, retryAuth: false });
  }
  return parseResponse(res);
}

export function unwrapList(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return [];
}
