"use client";

import { useState } from "react";
import { LEAD_SOURCES, LEAD_PRIORITIES } from "@/lib/constants";

const FIELD_CLASS =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function LeadForm({ salesUsers, showAssignee, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    source: LEAD_SOURCES[0],
    priority: "MEDIUM",
    notes: "",
    assignedToId: "",
  });
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
      const payload = { ...form };
      if (!payload.assignedToId) delete payload.assignedToId;
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full name *</label>
        <input
          required
          className={FIELD_CLASS}
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className={FIELD_CLASS}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input
            className={FIELD_CLASS}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
        <input
          className={FIELD_CLASS}
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Source</label>
          <select
            className={FIELD_CLASS}
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
          <select
            className={FIELD_CLASS}
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
          >
            {LEAD_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      {showAssignee && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Assign to (Sales)
          </label>
          <select
            className={FIELD_CLASS}
            value={form.assignedToId}
            onChange={(e) => update("assignedToId", e.target.value)}
          >
            <option value="">Unassigned</option>
            {salesUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          rows={3}
          className={FIELD_CLASS}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
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
          {submitting ? "Creating…" : "Create lead"}
        </button>
      </div>
    </form>
  );
}
