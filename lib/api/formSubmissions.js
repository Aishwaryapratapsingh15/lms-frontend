import { apiFetch, unwrapList } from "./client";

export async function listFormSubmissions() {
  const data = await apiFetch("/form-submissions");
  return unwrapList(data, "data", "submissions");
}
