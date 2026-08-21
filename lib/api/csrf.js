// The CSRF cookie is intentionally not httpOnly (unlike access_token/refresh_token)
// so the frontend can read it and echo it back as the x-csrf-token header —
// the backend's double-submit check compares the two.
export function readCsrfCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="));
  if (!match) return null;
  return decodeURIComponent(match.slice("csrf_token=".length));
}
