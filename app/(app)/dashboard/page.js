"use client";

import { useEffect, useMemo, useState } from "react";
import { getDashboard } from "@/lib/api/leads";
import Icon from "@/components/Icons";

const METRICS = [
  { key: "totalLeads", label: "Total leads", icon: "leads", tone: "bg-blue-50 text-blue-600", change: "+12.5%" },
  { key: "newLeads", label: "New leads", icon: "plus", tone: "bg-cyan-50 text-cyan-600", change: "+8.2%" },
  { key: "qualified", label: "Qualified", icon: "target", tone: "bg-violet-50 text-violet-600", change: "+5.7%" },
  { key: "won", label: "Deals won", icon: "check", tone: "bg-emerald-50 text-emerald-600", change: "+14.1%" },
];
const STAGES = [
  { key: "newLeads", color: "bg-blue-500", label: "New" },
  { key: "contacted", color: "bg-cyan-500", label: "Contacted" },
  { key: "qualified", color: "bg-violet-500", label: "Qualified" },
  { key: "won", color: "bg-emerald-500", label: "Won" },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getDashboard().then(setData).catch((err) => setError(err.message || "Failed to load dashboard")); }, []);
  const overview = useMemo(() => {
    if (!data) return [];
    const max = Math.max(...STAGES.map(({ key }) => Number(data[key] ?? 0)), 1);
    return STAGES.map((stage) => ({ ...stage, value: Number(data[stage.key] ?? 0), width: `${Math.max((Number(data[stage.key] ?? 0) / max) * 100, 6)}%` }));
  }, [data]);
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!data) return <div className="animate-pulse space-y-5"><div className="h-16 rounded-xl bg-slate-200/70"/><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4].map(x=><div key={x} className="h-36 rounded-xl bg-slate-200/70"/>)}</div></div>;
  const total = Number(data.totalLeads ?? 0);
  const conversion = total ? Math.round((Number(data.won ?? 0) / total) * 100) : 0;

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium text-slate-500">Tuesday, 18 August 2026</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Good afternoon, welcome back</h1><p className="mt-1 text-sm text-slate-500">Here’s what’s happening across your sales pipeline.</p></div>
      <button className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"><Icon name="download" size={16}/>Export report</button>
    </header>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((m) => <div key={m.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.tone}`}><Icon name={m.icon} size={18}/></div><span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600"><Icon name="arrowUp" size={12}/>{m.change}</span></div>
        <p className="mt-5 text-[26px] font-semibold tracking-tight text-slate-950">{data[m.key] ?? 0}</p><p className="mt-0.5 text-xs text-slate-500">{m.label}</p><p className="mt-3 text-[10px] text-slate-400">vs. previous 30 days</p>
      </div>)}
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
      <section className="rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Pipeline performance</h2><p className="mt-0.5 text-[11px] text-slate-500">Leads by qualification stage</p></div><span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{conversion}% win rate</span></div>
        <div className="space-y-5 p-5 md:p-6">{overview.map((item) => <div key={item.key}><div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-medium text-slate-700"><span className={`h-2 w-2 rounded-full ${item.color}`}/>{item.label}</span><span className="font-semibold text-slate-800">{item.value}<span className="ml-2 font-normal text-slate-400">{total ? Math.round(item.value/total*100) : 0}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{width:item.width}}/></div></div>)}</div>
      </section>
      <aside className="rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Today’s priorities</h2><p className="mt-0.5 text-[11px] text-slate-500">Tasks needing your attention</p></div>
        <div className="divide-y divide-slate-100">{[
          ["Follow up qualified leads", "12 leads", "High", "text-red-600 bg-red-50"],
          ["Review active proposals", "7 awaiting reply", "Medium", "text-amber-700 bg-amber-50"],
          ["Assign inbound leads", "5 unassigned", "Normal", "text-blue-700 bg-blue-50"],
        ].map(([title,meta,priority,tone])=><div key={title} className="flex items-start gap-3 p-4"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400"><Icon name="check" size={14}/></div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-800">{title}</p><p className="mt-1 text-[11px] text-slate-500">{meta}</p></div><span className={`rounded px-1.5 py-1 text-[9px] font-semibold ${tone}`}>{priority}</span></div>)}</div>
        <button className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50/50">View all tasks<Icon name="arrowRight" size={14}/></button>
      </aside>
    </div>
  </div>;
}
