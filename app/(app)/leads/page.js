"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { archiveLead, createLead, listLeads, restoreLead } from "@/lib/api/leads";
import { listUsers } from "@/lib/api/users";
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, ROLES } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import LeadForm from "@/components/forms/LeadForm";
import Icon from "@/components/Icons";

const INPUT = "h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100";
const INITIAL_FILTERS = { status: "", source: "", leadType: "", assignedToId: "", archived: "active", createdFrom: "", createdTo: "" };
const isArchived = (lead) => Boolean(lead.archivedAt ?? lead.isArchived ?? lead.archived);
const formatCreatedAt = (createdAt) => createdAt
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(createdAt))
  : "—";
const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const dayOffset = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
};
const ageRange = (age) => {
  if (age === "new") return { createdFrom: dayOffset(0), createdTo: dayOffset(0) };
  if (age === "3-days") return { createdFrom: dayOffset(3), createdTo: dayOffset(1) };
  if (age === "7-days") return { createdFrom: dayOffset(7), createdTo: dayOffset(4) };
  if (age === "old") return { createdFrom: "", createdTo: dayOffset(8) };
  return { createdFrom: "", createdTo: "" };
};
const leadAge = (createdAt) => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  created.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((today - created) / 86_400_000));
  if (days === 0) return { label: "New", className: "bg-emerald-50 text-emerald-700" };
  if (days <= 3) return { label: "3 days", className: "bg-blue-50 text-blue-700" };
  if (days <= 7) return { label: "7 days", className: "bg-amber-50 text-amber-700" };
  return { label: "Old", className: "bg-slate-100 text-slate-600" };
};

export default function LeadsPage() {
  const { hasFullAccess } = useAuth();
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [salesUsers, setSalesUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [age, setAge] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { if (hasFullAccess) listUsers().then((rows) => setSalesUsers(rows.filter((u) => u.role === ROLES.SALES))).catch(() => {}); }, [hasFullAccess]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listLeads({ page, limit: 20, search: debouncedSearch, ...filters });
      const rows = Array.isArray(result) ? result : result.data ?? [];
      setLeads([...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setMeta(Array.isArray(result) ? { page: 1, limit: result.length, total: result.length, pages: result.length ? 1 : 0 } : result.meta ?? { page, limit: 20, total: 0, pages: 0 });
    } catch (err) { setError(err.status === 403 ? "You do not have permission to view these leads." : err.message || "Failed to load leads"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  useEffect(() => {
    function refreshData() {
      load();
      if (hasFullAccess) listUsers().then((rows) => setSalesUsers(rows.filter((u) => u.role === ROLES.SALES))).catch(() => {});
    }
    window.addEventListener("lms:data-invalidated", refreshData);
    return () => window.removeEventListener("lms:data-invalidated", refreshData);
  }, [load, hasFullAccess]);
  function changeFilter(key, value) { setFilters((prev) => ({ ...prev, [key]: value })); setPage(1); }
  function changeAge(value) { setAge(value); setFilters((prev) => ({ ...prev, ...ageRange(value) })); setPage(1); }
  async function handleCreate(payload) { await createLead(payload); setShowForm(false); await load(); }
  async function toggleArchive(lead) { try { await (isArchived(lead) ? restoreLead(lead.id) : archiveLead(lead.id)); await load(); } catch (err) { setError(err.message || "Could not update archive status"); } }

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Leads</h1><p className="mt-1 text-sm text-slate-500">Track, qualify and move opportunities through your pipeline.</p></div><button onClick={() => setShowForm(true)} className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"><Icon name="plus" size={16}/>New lead</button></header>

    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 lg:flex-row"><div className="relative min-w-64 flex-1"><Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or company…" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"/></div>
        <select value={filters.status} onChange={(e) => changeFilter("status", e.target.value)} className={INPUT}><option value="">All statuses</option>{LEAD_STATUSES.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={filters.source} onChange={(e) => changeFilter("source", e.target.value)} className={INPUT}><option value="">All sources</option>{LEAD_SOURCES.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={filters.leadType} onChange={(e) => changeFilter("leadType", e.target.value)} className={INPUT}><option value="">All lead types</option>{LEAD_TYPES.map((v) => <option key={v} value={v}>{v === "INTERNAL" ? "Internal" : "External"}</option>)}</select>
      </div>
      <div className="flex flex-wrap items-center gap-2">{hasFullAccess && <select value={filters.assignedToId} onChange={(e) => changeFilter("assignedToId", e.target.value)} className={INPUT}><option value="">All salespeople</option>{salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select>}{hasFullAccess && <select value={filters.archived} onChange={(e) => changeFilter("archived", e.target.value)} className={INPUT}><option value="active">Active</option><option value="archived">Archived</option><option value="all">Active + archived</option></select>}<select value={age} onChange={(e) => changeAge(e.target.value)} className={INPUT}><option value="">All ages</option><option value="new">New</option><option value="3-days">3 days</option><option value="7-days">7 days</option><option value="old">Old</option></select><label className="flex items-center gap-2 text-xs text-slate-500">Created<input type="date" value={filters.createdFrom} onChange={(e) => { setAge(""); changeFilter("createdFrom", e.target.value); }} className={INPUT}/><span>to</span><input type="date" value={filters.createdTo} onChange={(e) => { setAge(""); changeFilter("createdTo", e.target.value); }} className={INPUT}/></label><button onClick={() => { setFilters(INITIAL_FILTERS); setAge(""); setSearch(""); setPage(1); }} className="h-9 px-2 text-xs font-semibold text-blue-600">Clear filters</button><span className="ml-auto text-xs font-medium text-slate-500">{meta.total} records</span></div>
    </section>

    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-400">Loading leads…</div> : leads.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No leads match these filters.</div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-4">Lead</th><th className="px-5 py-4">Company</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th>{hasFullAccess && <th className="px-5 py-4">Assigned to</th>}{hasFullAccess && <th className="px-5 py-4">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100">{leads.map((lead) => { const ageInfo = leadAge(lead.createdAt); return <tr key={lead.id} className="hover:bg-blue-50/30"><td className="px-5 py-4"><Link href={`/leads/${lead.id}`} className="font-semibold text-slate-800 hover:text-blue-600">{lead.fullName}</Link><p className="mt-0.5 text-[11px] text-slate-400">{lead.email || "No email"}</p>{isArchived(lead) && <span className="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-600">Archived</span>}</td><td className="px-5 py-4 text-slate-600">{lead.company || "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${lead.leadType === "INTERNAL" ? "bg-violet-50 text-violet-700" : lead.leadType === "EXTERNAL" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{lead.leadType === "INTERNAL" ? "Internal" : lead.leadType === "EXTERNAL" ? "External" : "Unspecified"}</span></td><td className="px-5 py-4"><StatusBadge status={lead.status}/></td><td className="whitespace-nowrap px-5 py-4 text-slate-600"><time dateTime={lead.createdAt}>{formatCreatedAt(lead.createdAt)}</time>{ageInfo && <span className={`ml-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${ageInfo.className}`}>{ageInfo.label}</span>}</td>{hasFullAccess && <td className="px-5 py-4 text-slate-600">{lead.assignedTo?.name ?? lead.assignedTo?.email ?? "Unassigned"}</td>}{hasFullAccess && <td className="px-5 py-4"><button onClick={() => toggleArchive(lead)} className="text-xs font-semibold text-blue-600 hover:underline">{isArchived(lead) ? "Restore" : "Archive"}</button></td>}</tr>; })}</tbody></table></div></div>}
    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Page {meta.page || page} of {Math.max(meta.pages || 0, 1)}</p><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((v) => v - 1)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">Previous</button><button disabled={page >= meta.pages || loading} onClick={() => setPage((v) => v + 1)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">Next</button></div></div>
    {showForm && <Modal title="New lead" onClose={() => setShowForm(false)}><LeadForm salesUsers={salesUsers} showAssignee={hasFullAccess} onSubmit={handleCreate} onCancel={() => setShowForm(false)}/></Modal>}
  </div>;
}
