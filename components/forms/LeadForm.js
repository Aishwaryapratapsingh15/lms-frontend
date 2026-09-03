"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEAD_SOURCES, LEAD_PRIORITIES, LEAD_STATUSES, LEAD_TYPES } from "@/lib/constants";

const FIELD_CLASS = "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100";
const EMPTY = { fullName: "", email: "", phone: "", company: "", source: LEAD_SOURCES[0], leadType: "", status: "NEW", priority: "MEDIUM", notes: "", assignedToId: "" };

export default function LeadForm({ salesUsers = [], showAssignee, initialValues, onSubmit, onCancel }) {
  const initial = useMemo(() => ({ ...EMPTY, ...initialValues, leadType: initialValues?.leadType ?? "", assignedToId: initialValues?.assignedTo?.id ?? initialValues?.assignedToId ?? "" }), [initialValues]);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(initialValues);

  function update(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }
  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setDuplicate(null); setSubmitting(true);
    try {
      let payload = { ...form };
      if (editing) {
        const editable = ["fullName", "email", "phone", "company", "source", "leadType", "priority", "notes", ...(showAssignee ? ["assignedToId"] : [])];
        payload = Object.fromEntries(editable.filter((key) => form[key] !== initial[key]).map((key) => [key, form[key]]));
        if (!Object.keys(payload).length) { setError("No changes to save"); return; }
      } else if (!payload.assignedToId) {
        delete payload.assignedToId;
      }
      await onSubmit(payload);
    } catch (err) {
      if (err.status === 409) setDuplicate(err.data?.lead ?? err.data?.duplicateLead ?? err.data);
      setError(err.message || `Failed to ${editing ? "update" : "create"} lead`);
    } finally { setSubmitting(false); }
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    <div><label className="mb-1 block text-sm font-medium text-slate-700">Full name *</label><input required className={FIELD_CLASS} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Email</label><input type="email" className={FIELD_CLASS} value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Phone</label><input className={FIELD_CLASS} value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} /></div>
    </div>
    <div><label className="mb-1 block text-sm font-medium text-slate-700">Company</label><input className={FIELD_CLASS} value={form.company ?? ""} onChange={(e) => update("company", e.target.value)} /></div>
    <div><label className="mb-1 block text-sm font-medium text-slate-700">Lead type *</label><select required className={FIELD_CLASS} value={form.leadType} onChange={(e) => update("leadType", e.target.value)}><option value="" disabled>Select lead type</option>{LEAD_TYPES.map((v) => <option key={v} value={v}>{v === "INTERNAL" ? "Internal" : "External"}</option>)}</select></div>
    <div className="grid grid-cols-3 gap-3">
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Source</label><select className={FIELD_CLASS} value={form.source} onChange={(e) => update("source", e.target.value)}>{LEAD_SOURCES.map((v) => <option key={v}>{v}</option>)}</select></div>
      {!editing && <div><label className="mb-1 block text-sm font-medium text-slate-700">Status</label><select className={FIELD_CLASS} value={form.status} onChange={(e) => update("status", e.target.value)}>{LEAD_STATUSES.map((v) => <option key={v}>{v}</option>)}</select></div>}
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Priority</label><select className={FIELD_CLASS} value={form.priority} onChange={(e) => update("priority", e.target.value)}>{LEAD_PRIORITIES.map((v) => <option key={v}>{v}</option>)}</select></div>
    </div>
    {showAssignee && <div><label className="mb-1 block text-sm font-medium text-slate-700">Assigned to</label><select className={FIELD_CLASS} value={form.assignedToId} onChange={(e) => update("assignedToId", e.target.value)}><option value="">Unassigned</option>{salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select></div>}
    <div><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea rows={3} className={`${FIELD_CLASS} h-auto py-2.5`} value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} /></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><p>{error}</p>{duplicate?.id && <Link href={`/leads/${duplicate.id}`} className="mt-1 inline-block font-semibold underline">Open existing lead{duplicate.fullName ? `: ${duplicate.fullName}` : ""}</Link>}</div>}
    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{submitting ? "Saving…" : editing ? "Save changes" : "Create lead"}</button></div>
  </form>;
}
