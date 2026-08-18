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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; lead/error aren't effect deps, so no cascade
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasFullAccess]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!lead) return <p className="text-sm text-slate-400">Loading…</p>;

  // Matches LeadsService.findOne()'s Prisma include: `followUps` (each with
  // a nested `user`) and `emailLogs` (not `emails`).
  const followUps = lead.followUps ?? [];
  const emailLogs = lead.emailLogs ?? [];

  async function handleStatusChange(status) {
    const updated = await updateLeadStatus(id, status);
    setLead((prev) => ({ ...prev, ...updated }));
  }

  async function handleAssign(assignedToId) {
    // assignLead() also auto-sets status to CONTACTED server-side — the
    // response reflects that, so merging it in keeps the status badge in sync.
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{lead.fullName}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={lead.status} />
          <PriorityBadge priority={lead.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{lead.email || "—"}</dd>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-800">{lead.phone || "—"}</dd>
              <dt className="text-slate-500">Company</dt>
              <dd className="text-slate-800">{lead.company || "—"}</dd>
              <dt className="text-slate-500">Source</dt>
              <dd className="text-slate-800">{lead.source || "—"}</dd>
            </dl>
            {lead.notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{lead.notes}</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Follow-ups</h2>
            {followUps.length === 0 ? (
              <p className="mb-4 text-sm text-slate-400">No follow-ups yet.</p>
            ) : (
              <ul className="mb-4 space-y-2">
                {followUps.map((f) => (
                  <li key={f.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{f.type}</span>{" "}
                    <span className="text-slate-500">
                      by {f.user?.name ?? f.user?.email ?? "—"} ·{" "}
                      {f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}
                    </span>
                    <p className="mt-1 text-slate-600">{f.notes}</p>
                  </li>
                ))}
              </ul>
            )}
            <FollowUpForm onSubmit={handleAddFollowUp} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Emails</h2>
            {emailLogs.length === 0 ? (
              <p className="mb-4 text-sm text-slate-400">No emails sent yet.</p>
            ) : (
              <ul className="mb-4 space-y-2">
                {emailLogs.map((e) => (
                  <li key={e.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{e.subject}</span>{" "}
                    <span className="text-slate-500">to {e.toEmail} · {e.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <EmailForm defaultToEmail={lead.email} onSubmit={handleSendEmail} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Status</h2>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Assign to</h2>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        </div>
      </div>
    </div>
  );
}
