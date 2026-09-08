"use client";

import { useState } from "react";

const FIELD_CLASS = "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100";
const ATTENDANCE_OPTIONS = ["ATTENDED", "VIRTUAL_MEETING"];
const ATTENDANCE_LABELS = { ATTENDED: "Attended", VIRTUAL_MEETING: "Virtual meeting" };

export default function VendorEventForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ productName: "", eventDate: "", attendance: "", notes: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.eventDate) delete payload.eventDate;
      if (!payload.attendance) delete payload.attendance;
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Failed to save vendor event");
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    <div><label className="mb-1 block text-sm font-medium text-slate-700">Product *</label><input required className={FIELD_CLASS} value={form.productName} onChange={(e) => update("productName", e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Event date</label><input type="date" className={FIELD_CLASS} value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Attendance</label><select className={FIELD_CLASS} value={form.attendance} onChange={(e) => update("attendance", e.target.value)}><option value="">Unspecified</option>{ATTENDANCE_OPTIONS.map((v) => <option key={v} value={v}>{ATTENDANCE_LABELS[v]}</option>)}</select></div>
    </div>
    <div><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea rows={3} className={`${FIELD_CLASS} h-auto py-2.5`} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{submitting ? "Saving…" : "Save event"}</button></div>
  </form>;
}
