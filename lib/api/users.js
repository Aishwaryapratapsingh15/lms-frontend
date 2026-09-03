import { apiFetch, unwrapList } from "./client";

export function createUser(payload) {
  return apiFetch("/users", { method: "POST", body: payload });
}

export async function listUsers() {
  const data = await apiFetch("/users");
  return unwrapList(data, "data", "users");
}

export function getUser(id) {
  return apiFetch(`/users/${id}`);
}

export function dismissUser(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}
