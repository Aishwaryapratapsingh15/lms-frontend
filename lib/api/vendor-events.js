import { apiFetch } from "./client";

export const listVendorEvents = () => apiFetch("/vendor-events");
export const createVendorEvent = (payload) => apiFetch("/vendor-events", { method: "POST", body: payload });
export const updateVendorEvent = (id, payload) => apiFetch(`/vendor-events/${id}`, { method: "PATCH", body: payload });
export const deleteVendorEvent = (id) => apiFetch(`/vendor-events/${id}`, { method: "DELETE" });
