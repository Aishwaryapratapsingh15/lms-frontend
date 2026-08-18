import { apiFetch } from "./client";

export function sendLeadEmail(payload) {
  return apiFetch("/emails/send", { method: "POST", body: payload });
}
