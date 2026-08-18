import { apiFetch, unwrapList } from "./client";

export function createLead(payload) {
  return apiFetch("/leads", { method: "POST", body: payload });
}

export async function listLeads() {
  const data = await apiFetch("/leads");
  return unwrapList(data, "data", "leads");
}

export function getDashboard() {
  return apiFetch("/leads/dashboard");
}

export function getLead(id) {
  return apiFetch(`/leads/${id}`);
}

export function assignLead(id, assignedToId) {
  return apiFetch(`/leads/${id}/assign`, { method: "PATCH", body: { assignedToId } });
}

export function updateLeadStatus(id, status) {
  return apiFetch(`/leads/${id}/status`, { method: "PATCH", body: { status } });
}

export function addFollowUp(payload) {
  return apiFetch("/leads/follow-up", { method: "POST", body: payload });
}
