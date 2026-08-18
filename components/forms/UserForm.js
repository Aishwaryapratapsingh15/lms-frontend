"use client";

import { useState } from "react";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

const FIELD_CLASS =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function UserForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: ROLES.SALES });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
        <input
          required
          className={FIELD_CLASS}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
        <input
          required
          type="email"
          className={FIELD_CLASS}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
        <input
          required
          type="password"
          className={FIELD_CLASS}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Role *</label>
        <select
          className={FIELD_CLASS}
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
        >
          {Object.values(ROLES).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}
