"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { listLeads, createLead } from "@/lib/api/leads";
import { listUsers } from "@/lib/api/users";
import { ROLES } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import Modal from "@/components/Modal";
import LeadForm from "@/components/forms/LeadForm";
import Icon from "@/components/Icons";

function assignedLabel(lead, salesUsers) {
  if (lead.assignedTo?.name) return lead.assignedTo.name;
  if (lead.assignedTo?.email) return lead.assignedTo.email;
  const match = salesUsers.find((u) => u.id === lead.assignedToId);
  return match ? (match.name ?? match.email) : lead.assignedToId ? "Assigned" : "Unassigned";
}

function belongsToUser(lead, userId) {
  return lead.assignedTo?.id === userId || lead.assignedToId === userId;
}

export default function LeadsPage() {
  const { user, hasFullAccess } = useAuth();
  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [leadData, userData] = await Promise.all([
        listLeads(),
        hasFullAccess ? listUsers() : Promise.resolve([]),
      ]);
      setLeads(leadData);
      setSalesUsers(userData.filter((u) => u.role === ROLES.SALES));
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Data is fetched asynchronously; loading state is intentionally reset per access scope.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFullAccess]);

  const visibleLeads = hasFullAccess ? leads : leads.filter((l) => belongsToUser(l, user?.id));

  async function handleCreate(payload) {
    await createLead({ ...payload, createdById: user?.id });
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">Track, qualify and move opportunities through your pipeline.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Icon name="plus" size={16} /> New lead
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs"><Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input placeholder="Search leads..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"/></div>
        <div className="flex items-center gap-2"><select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"><option>All statuses</option></select><select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"><option>All priorities</option></select><span className="whitespace-nowrap px-2 text-xs font-medium text-slate-500">{visibleLeads.length} records</span></div>
      </div>

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">
          Loading leads…
        </div>
      ) : visibleLeads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          No leads yet. Start by creating your first opportunity.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Lead</th>
                  <th className="px-5 py-4 font-semibold">Company</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  {hasFullAccess && <th className="px-5 py-4 font-semibold">Assigned to</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleLeads.map((lead) => (
                  <tr key={lead.id} className="group transition hover:bg-blue-50/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600">{lead.fullName?.slice(0,1)?.toUpperCase()}</div><div><Link href={`/leads/${lead.id}`} className="font-semibold text-slate-800 hover:text-blue-600">{lead.fullName}</Link><p className="mt-0.5 text-[11px] text-slate-400">{lead.email || "No email"}</p></div></div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{lead.company || "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    {hasFullAccess && <td className="px-5 py-4 text-slate-600">{assignedLabel(lead, salesUsers)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="New lead" onClose={() => setShowForm(false)}>
          <LeadForm
            salesUsers={salesUsers}
            showAssignee={hasFullAccess}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
