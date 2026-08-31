import { apiFetch } from "./client";

function withQuery(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${path}?${query}` : path;
}

export const createLead = (payload) => apiFetch("/leads", { method: "POST", body: payload });
export const listLeads = (params) => apiFetch(withQuery("/leads", params));
export const getDashboard = (params) => apiFetch(withQuery("/leads/dashboard", params));
export const getLead = (id) => apiFetch(`/leads/${id}`);
export const getLeadTimeline = (id) => apiFetch(`/leads/${id}/timeline`);
export const updateLead = (id, payload) => apiFetch(`/leads/${id}`, { method: "PATCH", body: payload });
export const assignLead = (id, assignedToId) => apiFetch(`/leads/${id}/assign`, { method: "PATCH", body: { assignedToId } });
export const updateLeadStatus = (id, status) => apiFetch(`/leads/${id}/status`, { method: "PATCH", body: { status } });
export const archiveLead = (id) => apiFetch(`/leads/${id}/archive`, { method: "PATCH" });
export const restoreLead = (id) => apiFetch(`/leads/${id}/restore`, { method: "PATCH" });
export const addFollowUp = (payload) => apiFetch("/leads/follow-up", { method: "POST", body: payload });
export const listReminders = (range = "all", limit = 50) => apiFetch(withQuery("/leads/reminders", { range, limit }));
export const getCalendarEvents = (from, to) => apiFetch(withQuery("/leads/calendar", { from, to }));
export const completeFollowUp = (followUpId) => apiFetch(`/leads/follow-ups/${followUpId}/complete`, { method: "PATCH" });
