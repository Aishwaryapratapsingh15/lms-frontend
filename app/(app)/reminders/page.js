"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { completeFollowUp, listReminders } from "@/lib/api/leads";

const RANGES = ["overdue", "today", "upcoming", "all"];
function overdueFor(date) {
  const ms = Date.now() - new Date(date).getTime();
  if (ms <= 0) return "";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days ? `${days}d ${hours}h overdue` : `${Math.max(hours, 1)}h overdue`;
}

export default function RemindersPage() {
  const [range, setRange] = useState("overdue");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await listReminders(range, 50); setRows(Array.isArray(data) ? data : data?.data ?? data?.reminders ?? []); }
    catch (err) { setError(err.message || "Failed to load reminders"); }
    finally { setLoading(false); }
  }, [range]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  async function complete(id) { try { await completeFollowUp(id); await load(); } catch (err) { setError(err.message || "Could not complete reminder"); } }

  return <div className="space-y-5"><header><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Follow-up reminders</h1><p className="mt-1 text-sm text-slate-500">Stay ahead of every scheduled conversation.</p></header>
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-soft)]">{RANGES.map((item) => <button key={item} onClick={() => setRange(item)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize ${range === item ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{item}</button>)}</div>
    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {/* eslint-disable-next-line react-hooks/purity */}
    {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-400">Loading reminders…</div> : rows.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No {range} reminders.</div> : <div className="grid gap-3">{rows.map((item) => { const lead = item.lead ?? {}; const due = item.nextFollowUpAt ?? item.reminderAt; return <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{item.type}</span>{due && Date.now() > new Date(due).getTime() && <span className="text-xs font-semibold text-red-600">{overdueFor(due)}</span>}</div><Link href={`/leads/${lead.id ?? item.leadId}`} className="mt-3 block text-base font-semibold text-slate-900 hover:text-blue-600">{lead.fullName ?? item.leadName ?? "Lead"}</Link><p className="mt-1 text-xs text-slate-500">{lead.company || lead.email || "No company"} · Assigned to {lead.assignedTo?.name ?? item.assignedTo?.name ?? "Unassigned"}</p>{item.notes && <p className="mt-3 text-sm text-slate-700">{item.notes}</p>}</div><div className="shrink-0 text-left sm:text-right"><p className="text-xs font-medium text-slate-600">{due ? new Date(due).toLocaleString() : "No reminder time"}</p><button onClick={() => complete(item.id)} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Mark complete</button></div></div></article>; })}</div>}
  </div>;
}
