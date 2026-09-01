import { apiFetch } from "./client";

export const getEmailSettings = () => apiFetch("/settings/email");
export const updateEmailSettings = (payload) =>
  apiFetch("/settings/email", { method: "PATCH", body: payload });
