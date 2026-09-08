"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { listLeads, unmarkProspect } from "@/lib/api/leads";
import { listUsers } from "@/lib/api/users";
import { LEAD_STATUSES, LEAD_TYPES, ROLES } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import Icon from "@/components/Icons";

const INPUT = "h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100";
const INITIAL_FILTERS = { status: "", leadType: "", assignedToId: "" };
const formatCreatedAt = (createdAt) => createdAt
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(createdAt))
  : "—";
const monthRange = (value) => {
  if (!value) return { prospectedFrom: "", prospectedTo: "" };
  const [year, month] = value.split("-").map(Number);
  const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const to = new Date(year, month, 0, 23, 59, 59, 999);
  return { prospectedFrom: from.toISOString(), prospectedTo: to.toISOString() };
};

export default function ProspectsPage() {
  const { hasFullAccess } = useAuth();
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [salesUsers, setSalesUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { if (hasFullAccess) listUsers().then((rows) => setSalesUsers(rows.filter((u) => u.role === ROLES.SALES))).catch(() => {}); }, [hasFullAccess]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listLeads({ page, limit: 20, search: debouncedSearch, ...filters, ...monthRange(month), prospect: "only" });
      const rows = Array.isArray(result) ? result : result.data ?? [];
      setLeads([...rows].sort((a, b) => new Date(b.prospectedAt ?? b.createdAt).getTime() - new Date(a.prospectedAt ?? a.createdAt).getTime()));
      setMeta(Array.isArray(result) ? { page: 1, limit: result.length, total: result.length, pages: result.length ? 1 : 0 } : result.meta ?? { page, limit: 20, total: 0, pages: 0 });
    } catch (err) { setError(err.status === 403 ? "You do not have permission to view these leads." : err.message || "Failed to load prospects"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filters, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  useEffect(() => {
    window.addEventListener("lms:data-invalidated", load);
    return () => window.removeEventListener("lms:data-invalidated", load);
  }, [load]);
  function changeFilter(key, value) { setFilters((prev) => ({ ...prev, [key]: value })); setPage(1); }
  async function handleUnprospect(lead) { try { await unmarkProspect(lead.id); await load(); } catch (err) { setError(err.message || "Could not move this lead back to Leads"); } }

  return <div className="space-y-5">
    <header><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Prospects</h1><p className="mt-1 text-sm text-slate-500">Leads a salesperson has qualified as worth pursuing after a first call or meeting.</p></header>

    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 lg:flex-row"><div className="relative min-w-64 flex-1"><Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or company…" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"/></div>
        <select value={filters.status} onChange={(e) => changeFilter("status", e.target.value)} className={INPUT}><option value="">All statuses</option>{LEAD_STATUSES.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={filters.leadType} onChange={(e) => changeFilter("leadType", e.target.value)} className={INPUT}><option value="">All lead types</option>{LEAD_TYPES.map((v) => <option key={v} value={v}>{v === "INTERNAL" ? "Internal" : "External"}</option>)}</select>
        <label className="flex items-center gap-2 text-xs text-slate-500">Moved in<input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className={INPUT}/></label>
      </div>
      <div className="flex flex-wrap items-center gap-2">{hasFullAccess && <select value={filters.assignedToId} onChange={(e) => changeFilter("assignedToId", e.target.value)} className={INPUT}><option value="">All salespeople</option>{salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select>}<button onClick={() => { setFilters(INITIAL_FILTERS); setMonth(""); setSearch(""); setPage(1); }} className="h-9 px-2 text-xs font-semibold text-blue-600">Clear filters</button><span className="ml-auto text-xs font-medium text-slate-500">{meta.total} records</span></div>
    </section>

    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-400">Loading prospects…</div> : leads.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No prospects match these filters.</div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-4">Lead</th><th className="px-5 py-4">Company</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Moved to Prospect</th>{hasFullAccess && <th className="px-5 py-4">Assigned to</th>}<th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{leads.map((lead) => <tr key={lead.id} className="hover:bg-emerald-50/30"><td className="px-5 py-4"><Link href={`/leads/${lead.id}`} className="font-semibold text-slate-800 hover:text-blue-600">{lead.fullName}</Link><p className="mt-0.5 text-[11px] text-slate-400">{lead.email || "No email"}</p></td><td className="px-5 py-4 text-slate-600">{lead.company || "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${lead.leadType === "INTERNAL" ? "bg-violet-50 text-violet-700" : lead.leadType === "EXTERNAL" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{lead.leadType === "INTERNAL" ? "Internal" : lead.leadType === "EXTERNAL" ? "External" : "Unspecified"}</span></td><td className="px-5 py-4"><StatusBadge status={lead.status}/></td><td className="whitespace-nowrap px-5 py-4 text-slate-600"><time dateTime={lead.prospectedAt}>{formatCreatedAt(lead.prospectedAt)}</time></td>{hasFullAccess && <td className="px-5 py-4 text-slate-600">{lead.assignedTo?.name ?? lead.assignedTo?.email ?? "Unassigned"}</td>}<td className="px-5 py-4"><button onClick={() => handleUnprospect(lead)} className="text-xs font-semibold text-blue-600 hover:underline">Move back to Leads</button></td></tr>)}</tbody></table></div></div>}
    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Page {meta.page || page} of {Math.max(meta.pages || 0, 1)}</p><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((v) => v - 1)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">Previous</button><button disabled={page >= meta.pages || loading} onClick={() => setPage((v) => v + 1)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">Next</button></div></div>
  </div>;
}
