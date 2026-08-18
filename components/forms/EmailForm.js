"use client";

import { useState } from "react";

const FIELD_CLASS =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function EmailForm({ defaultToEmail, onSubmit }) {
  const [toEmail, setToEmail] = useState(defaultToEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ toEmail, subject, body });
      setSubject("");
      setBody("");
    } catch (err) {
      setError(err.message || "Failed to send email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">To *</label>
        <input
          required
          type="email"
          className={FIELD_CLASS}
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
        <input
          required
          className={FIELD_CLASS}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Message *</label>
        <textarea
          required
          rows={4}
          className={FIELD_CLASS}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
