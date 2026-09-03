"use client";

import { useRef, useState } from "react";
import RichTextEditor from "./RichTextEditor";

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100";

const parseEmails = (value) =>
  value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

export default function EmailForm({ defaultToEmail, onSubmit }) {
  const [toEmail, setToEmail] = useState(defaultToEmail || "");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (editorRef.current?.isEmpty()) {
      setError("Message is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        toEmail,
        ccEmails: parseEmails(ccEmails),
        bccEmails: parseEmails(bccEmails),
        subject,
        body,
      });
      setSubject("");
      setBody("");
      editorRef.current?.clear();
      setCcEmails("");
      setBccEmails("");
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CC</label>
          <input
            type="text"
            placeholder="comma-separated emails"
            className={FIELD_CLASS}
            value={ccEmails}
            onChange={(e) => setCcEmails(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">BCC</label>
          <input
            type="text"
            placeholder="comma-separated emails"
            className={FIELD_CLASS}
            value={bccEmails}
            onChange={(e) => setBccEmails(e.target.value)}
          />
        </div>
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
        <RichTextEditor ref={editorRef} onChange={setBody} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
