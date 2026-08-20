"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getLead, updateLeadStatus, assignLead, addFollowUp } from "@/lib/api/leads";
import { sendLeadEmail } from "@/lib/api/emails";
import { listUsers } from "@/lib/api/users";
import { LEAD_STATUSES, ROLES } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import FollowUpForm from "@/components/forms/FollowUpForm";
import EmailForm from "@/components/forms/EmailForm";
import Icon from "@/components/Icons";

export default function LeadDetailPage({ params }) {
  const { id } = use(params);
  const { user, hasFullAccess } = useAuth();
  const [lead, setLead] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [leadData, userData] = await Promise.all([
        getLead(id),
        hasFullAccess ? listUsers() : Promise.resolve([]),
      ]);
      setLead(leadData);
      setSalesUsers(userData.filter((u) => u.role === ROLES.SALES));
    } catch (err) {
      setError(err.message || "Failed to load lead");
    }
  }

  useEffect(() => {
    // Data is fetched asynchronously whenever the selected lead or access scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasFullAccess]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!lead) return <p className="text-sm text-slate-400">Loading lead…</p>;

  const followUps = lead.followUps ?? [];
  const emailLogs = lead.emailLogs ?? [];

  async function handleStatusChange(status) {
    const updated = await updateLeadStatus(id, status);
    setLead((prev) => ({ ...prev, ...updated }));
  }

  async function handleAssign(assignedToId) {
    const updated = await assignLead(id, assignedToId);
    setLead((prev) => ({ ...prev, ...updated }));
  }

  async function handleAddFollowUp(payload) {
    await addFollowUp({ ...payload, leadId: id, userId: user?.id });
    load();
  }

  async function handleSendEmail(payload) {
    await sendLeadEmail({ ...payload, leadId: id, userId: user?.id });
    load();
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Leads / Lead profile</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">{lead.fullName}</h1>
            <p className="mt-1 text-sm text-slate-500">{lead.company || "Individual lead"} · {lead.email || "No email provided"}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="flex items-center gap-2"><Icon name="leads" size={17} className="text-blue-600"/><h2 className="text-sm font-semibold text-slate-900">Contact overview</h2></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{lead.email || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phone</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{lead.phone || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Company</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{lead.company || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Source</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{lead.source || "—"}</p>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{lead.notes}</p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="flex items-center gap-2"><Icon name="calendar" size={17} className="text-blue-600"/><h2 className="text-sm font-semibold text-slate-900">Follow-ups</h2></div>
            {followUps.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No follow-ups yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {followUps.map((f) => (
                  <li key={f.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-800">{f.type}</span>
                      <span className="text-slate-500">{f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}</span>
                    </div>
                    <p className="mt-2 text-slate-500">by {f.user?.name ?? f.user?.email ?? "—"}</p>
                    <p className="mt-2 text-slate-700">{f.notes}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <FollowUpForm onSubmit={handleAddFollowUp} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="flex items-center gap-2"><Icon name="mail" size={17} className="text-blue-600"/><h2 className="text-sm font-semibold text-slate-900">Emails</h2></div>
            {emailLogs.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No emails sent yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {emailLogs.map((e) => (
                  <li key={e.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-800">{e.subject}</span>
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-700">
                        {e.status}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-500">to {e.toEmail}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <EmailForm defaultToEmail={lead.email} onSubmit={handleSendEmail} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Pipeline status</h2>
            <select
              className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </section>

          {hasFullAccess && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
              <h2 className="text-sm font-semibold text-slate-900">Lead owner</h2>
              <select
                className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
                value={lead.assignedTo?.id ?? lead.assignedToId ?? ""}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
