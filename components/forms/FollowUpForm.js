"use client";

import { useState } from "react";
import { FOLLOW_UP_TYPES } from "@/lib/constants";

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100";

export default function FollowUpForm({ onSubmit }) {
  const [type, setType] = useState(FOLLOW_UP_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { type, notes };
      if (nextFollowUpAt) payload.nextFollowUpAt = new Date(nextFollowUpAt).toISOString();
      await onSubmit(payload);
      setNotes("");
      setNextFollowUpAt("");
    } catch (err) {
      setError(err.message || "Failed to add follow-up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
          <select className={FIELD_CLASS} value={type} onChange={(e) => setType(e.target.value)}>
            {FOLLOW_UP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Next follow-up</label>
          <input
            type="datetime-local"
            className={FIELD_CLASS}
            value={nextFollowUpAt}
            onChange={(e) => setNextFollowUpAt(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes *</label>
        <textarea
          required
          rows={2}
          className={FIELD_CLASS}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add follow-up"}
      </button>
    </form>
  );
}
