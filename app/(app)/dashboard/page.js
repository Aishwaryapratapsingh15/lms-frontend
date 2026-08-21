"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getDashboard } from "@/lib/api/leads";

const CARDS = [["total","Total leads"],["assigned","Assigned"],["unassigned","Unassigned"],["won","Deals won"],["conversionRate","Conversion rate"],["overdueFollowUps","Overdue follow-ups"]];
const COLORS = ["bg-blue-500","bg-cyan-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500"];
function Chart({ title, values = {} }) {
  const entries = Object.entries(values);
  const max = Math.max(...entries.map(([, value]) => Number(value)), 1);
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]"><h2 className="text-sm font-semibold text-slate-900">{title}</h2>{entries.length === 0 ? <p className="mt-4 text-sm text-slate-400">No data for this range.</p> : <div className="mt-5 space-y-4">{entries.map(([label,value], index) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-600">{label.replaceAll("_", " ")}</span><b>{value}</b></div><div className="h-2 rounded bg-slate-100"><div className={`h-2 rounded ${COLORS[index % COLORS.length]}`} style={{ width: `${Math.max(Number(value) / max * 100, 3)}%` }}/></div></div>)}</div>}</section>;
}

export default function DashboardPage() {
  const { hasFullAccess } = useAuth();
  const [data, setData] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setData(null); setError("");
    try { setData(await getDashboard({ from: from ? new Date(`${from}T00:00:00`).toISOString() : "", to: to ? new Date(`${to}T23:59:59.999`).toISOString() : "" })); }
    catch (err) { setError(err.message || "Failed to load dashboard"); }
  }, [from, to]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return <div className="space-y-6"><header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Sales dashboard</h1><p className="mt-1 text-sm text-slate-500">A live view of your lead pipeline and follow-up health.</p></div><div className="flex items-center gap-2 text-xs"><label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 h-9 rounded-lg border border-slate-200 px-2"/></label><label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 h-9 rounded-lg border border-slate-200 px-2"/></label>{(from || to) && <button onClick={() => { setFrom(""); setTo(""); }} className="font-semibold text-blue-600">Clear</button>}</div></header>
    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {!data ? !error && <div className="h-36 animate-pulse rounded-xl bg-slate-200/70"/> : <><section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">{CARDS.map(([key,label]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]"><p className="text-2xl font-semibold text-slate-950">{data[key] ?? 0}{key === "conversionRate" ? "%" : ""}</p><p className="mt-1 text-xs text-slate-500">{label}</p>{key === "overdueFollowUps" && <Link href="/reminders" className="mt-3 inline-block text-[11px] font-semibold text-blue-600">View reminders →</Link>}</div>)}</section><div className="grid gap-5 lg:grid-cols-3"><Chart title="By status" values={data.byStatus}/><Chart title="By source" values={data.bySource}/><Chart title="By priority" values={data.byPriority}/></div>{hasFullAccess && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]"><div className="border-b border-slate-100 p-5"><h2 className="text-sm font-semibold">Salesperson performance</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Salesperson</th><th className="px-5 py-3">Total leads</th><th className="px-5 py-3">Won</th><th className="px-5 py-3">Conversion</th></tr></thead><tbody className="divide-y divide-slate-100">{(data.salesPerformance ?? []).map((row) => <tr key={row.user.id}><td className="px-5 py-4"><b>{row.user.name}</b><p className="text-xs text-slate-500">{row.user.email}</p></td><td className="px-5 py-4">{row.total}</td><td className="px-5 py-4">{row.won}</td><td className="px-5 py-4">{row.conversionRate}%</td></tr>)}</tbody></table></div>{!data.salesPerformance?.length && <p className="p-5 text-sm text-slate-400">No salesperson data for this range.</p>}</section>}</>}
  </div>;
}
