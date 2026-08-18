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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; leads/loading/error aren't effect deps, so no cascade
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFullAccess]);

  // Defensive client-side filter — kept even though the backend likely
  // already scopes /leads by role, in case it doesn't.
  const visibleLeads = hasFullAccess ? leads : leads.filter((l) => belongsToUser(l, user?.id));

  async function handleCreate(payload) {
    await createLead({ ...payload, createdById: user?.id });
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New lead
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : visibleLeads.length === 0 ? (
        <p className="text-sm text-slate-400">No leads yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                {hasFullAccess && <th className="px-4 py-3">Assigned to</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline">
                      {lead.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.company || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  {hasFullAccess && (
                    <td className="px-4 py-3 text-slate-600">{assignedLabel(lead, salesUsers)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
