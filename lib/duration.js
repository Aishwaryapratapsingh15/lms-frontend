// Parses jsonwebtoken-style TTL strings ("15m", "7d", "3600s") — as returned
// in the backend's login/refresh `expiresIn` field — into milliseconds.
export function parseTtlToMs(ttl) {
  if (typeof ttl === "number") return ttl * 1000;
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(String(ttl ?? "").trim());
  if (!match) return 15 * 60 * 1000; // fallback: backend's own default TTL
  const value = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  const factor = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return value * factor;
}
