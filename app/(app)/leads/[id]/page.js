"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { addFollowUp, archiveLead, assignLead, getLead, getLeadTimeline, restoreLead, updateLead, updateLeadStatus } from "@/lib/api/leads";
import { sendLeadEmail } from "@/lib/api/emails";
import { listUsers } from "@/lib/api/users";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, ROLES } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import FollowUpForm from "@/components/forms/FollowUpForm";
import EmailForm from "@/components/forms/EmailForm";
import LeadForm from "@/components/forms/LeadForm";
import Modal from "@/components/Modal";

const ACTIVITY_LABELS = { CREATED: "Lead created", UPDATED: "Lead updated", ASSIGNED: "Lead assigned", STATUS_CHANGED: "Status changed", FOLLOW_UP_ADDED: "Follow-up added", FOLLOW_UP_COMPLETED: "Follow-up completed", EMAIL_SENT: "Email sent", ARCHIVED: "Lead archived", RESTORED: "Lead restored" };
const FOLLOW_UP_TYPE_LABELS = { CALL: "Call", EMAIL: "Email", MEETING: "Meeting", NOTE: "Note" };
const FIELD_LABELS = { fullName: "Name", email: "Email", phone: "Phone", company: "Company", source: "Source", priority: "Priority", notes: "Notes", status: "Status", assignedToId: "Assignee" };
const archived = (lead) => Boolean(lead?.archivedAt ?? lead?.isArchived ?? lead?.archived);
const userLabel = (users, id) => { if (!id) return "Unassigned"; const match = users.find((u) => u.id === id); return match ? (match.name ?? match.email) : "a user"; };

function CalendarBadge({ followUp: f }) {
  if (f.completedAt) return null;
  if (f.calendarEventId) return <span title="Synced to Outlook calendar" className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">📅 Synced</span>;
  if (f.calendarSyncError) return <span title={f.calendarSyncError} className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">📅 Sync failed</span>;
  return null;
}

function describeActivity(item, salesUsers) {
  const d = item.details;
  if (d == null) return null;
  if (typeof d === "string") return d;
  switch (item.type) {
    case "CREATED":
      return `Status: ${LEAD_STATUS_LABELS[d.status] ?? d.status}${d.assignedToId ? `, assigned to ${userLabel(salesUsers, d.assignedToId)}` : ""}`;
    case "ASSIGNED":
      return `${userLabel(salesUsers, d.previousAssignedToId)} → ${userLabel(salesUsers, d.assignedToId)}`;
    case "STATUS_CHANGED":
      return `${LEAD_STATUS_LABELS[d.previousStatus] ?? d.previousStatus} → ${LEAD_STATUS_LABELS[d.status] ?? d.status}`;
    case "FOLLOW_UP_ADDED":
      return `${FOLLOW_UP_TYPE_LABELS[d.type] ?? d.type}${d.nextFollowUpAt ? `, next follow-up on ${new Date(d.nextFollowUpAt).toLocaleString()}` : ""}`;
    case "FOLLOW_UP_COMPLETED":
      return null;
    case "EMAIL_SENT":
      return `To ${d.toEmail}${d.status && d.status !== "SENT" ? ` (${d.status.toLowerCase()})` : ""}`;
    case "UPDATED":
      return d.changes && Object.keys(d.changes).length ? `Updated: ${Object.keys(d.changes).map((k) => FIELD_LABELS[k] ?? k).join(", ")}` : null;
    default:
      return null;
  }
}

export default function LeadDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { hasFullAccess } = useAuth();
  const [lead, setLead] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [leadData, timelineData, userData] = await Promise.all([getLead(id), getLeadTimeline(id), hasFullAccess ? listUsers() : Promise.resolve([])]);
      setLead(leadData);
      setTimeline(Array.isArray(timelineData) ? timelineData : timelineData?.data ?? timelineData?.timeline ?? []);
      setSalesUsers(userData.filter((u) => u.role === ROLES.SALES));
    } catch (err) { setError(err.status === 404 ? "This lead was not found or is not accessible to you." : err.status === 403 ? "You do not have permission to access this lead." : err.message || "Failed to load lead"); }
  }, [id, hasFullAccess]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function mutate(action) { try { await action(); await load(); } catch (err) { setError(err.message || "Could not update lead"); } }
  if (error && !lead) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => router.push("/leads")} className="ml-3 font-semibold underline">Back to leads</button></div>;
  if (!lead) return <p className="text-sm text-slate-400">Loading lead…</p>;
  const followUps = lead.followUps ?? [];
  const emailLogs = lead.emailLogs ?? [];

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-medium text-slate-500">Leads / Lead profile</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">{lead.fullName}</h1><p className="mt-1 text-sm text-slate-500">{lead.company || "Individual lead"} · {lead.email || "No email provided"}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={lead.status}/><PriorityBadge priority={lead.priority}/>{archived(lead) && <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">Archived</span>}<button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button>{hasFullAccess && <button onClick={() => mutate(() => archived(lead) ? restoreLead(id) : archiveLead(id))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600">{archived(lead) ? "Restore" : "Archive"}</button>}</div></header>
    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.9fr]"><div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6"><h2 className="text-sm font-semibold text-slate-900">Contact overview</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[["Email",lead.email],["Phone",lead.phone],["Company",lead.company],["Source",lead.source]].map(([label,value]) => <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-800">{value || "—"}</p></div>)}</div>{lead.notes && <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{lead.notes}</p></div>}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6"><h2 className="text-sm font-semibold text-slate-900">Activity timeline</h2>{timeline.length === 0 ? <p className="mt-4 text-sm text-slate-400">No activity recorded yet.</p> : <ol className="mt-5 space-y-4 border-l border-slate-200 pl-5">{timeline.map((item, index) => <li key={item.id ?? `${item.createdAt}-${index}`} className="relative"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white"/><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{ACTIVITY_LABELS[item.type] ?? item.type}</p><time className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</time></div>{item.actor && <p className="mt-1 text-xs text-slate-500">by {item.actor.name ?? item.actor.email}</p>}{describeActivity(item, salesUsers) && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{describeActivity(item, salesUsers)}</p>}</li>)}</ol>}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6"><h2 className="text-sm font-semibold text-slate-900">Follow-ups</h2>{followUps.length === 0 ? <p className="mt-4 text-sm text-slate-400">No follow-ups yet.</p> : <ul className="mt-4 space-y-3">{followUps.map((f) => <li key={f.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span className="flex items-center gap-2"><b>{f.type}</b><CalendarBadge followUp={f}/></span><span className="text-slate-500">{f.nextFollowUpAt ? new Date(f.nextFollowUpAt).toLocaleString() : ""}</span></div><p className="mt-2 text-slate-700">{f.notes}</p></li>)}</ul>}<div className="mt-5"><FollowUpForm onSubmit={async (payload) => { await addFollowUp({ ...payload, leadId: id }); await load(); }}/></div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6"><h2 className="text-sm font-semibold text-slate-900">Emails</h2>{emailLogs.length === 0 ? <p className="mt-4 text-sm text-slate-400">No emails sent yet.</p> : <ul className="mt-4 space-y-3">{emailLogs.map((e) => <li key={e.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"><b>{e.subject}</b><p className="mt-1 text-slate-500">to {e.toEmail}</p></li>)}</ul>}<div className="mt-5"><EmailForm defaultToEmail={lead.email} onSubmit={async (payload) => { await sendLeadEmail({ ...payload, leadId: id }); await load(); }}/></div></section>
    </div><aside className="space-y-6"><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold">Pipeline status</h2><select className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" value={lead.status} onChange={(e) => mutate(() => updateLeadStatus(id, e.target.value))}>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s] ?? s}</option>)}</select></section>{hasFullAccess && <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold">Lead owner</h2><select className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" value={lead.assignedTo?.id ?? lead.assignedToId ?? ""} onChange={(e) => mutate(() => assignLead(id, e.target.value))}><option value="">Unassigned</option>{salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select></section>}</aside></div>
    {editing && <Modal title="Edit lead" onClose={() => setEditing(false)}><LeadForm initialValues={lead} onSubmit={async (payload) => { await updateLead(id, payload); setEditing(false); await load(); }} onCancel={() => setEditing(false)}/></Modal>}
  </div>;
}
