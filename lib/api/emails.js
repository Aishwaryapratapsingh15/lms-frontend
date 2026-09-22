import { apiFetch } from "./client";

export function sendLeadEmail({ attachments, ...payload }) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
  }
  for (const file of attachments ?? []) formData.append("attachments", file);
  return apiFetch("/emails/send", { method: "POST", body: formData });
}
