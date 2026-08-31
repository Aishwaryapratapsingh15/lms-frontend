"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getCalendarEvents } from "@/lib/api/leads";

const FOLLOW_UP_TYPE_LABELS = { CALL: "Call", EMAIL: "Email", MEETING: "Meeting", NOTE: "Note" };
const TYPE_COLORS = { CALL: "bg-blue-100 text-blue-700", EMAIL: "bg-violet-100 text-violet-700", MEETING: "bg-emerald-100 text-emerald-700", NOTE: "bg-slate-200 text-slate-700" };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfMonth = (d) => { const r = new Date(d); r.setDate(1); r.setHours(0, 0, 0, 0); return r; };

function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
}

export default function CalendarPage() {
  const { hasFullAccess } = useAuth();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const from = days[0];
      const to = new Date(days[days.length - 1]); to.setDate(to.getDate() + 1);
      const data = await getCalendarEvents(from.toISOString(), to.toISOString());
      setEvents(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) { setError(err.message || "Failed to load calendar"); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.nextFollowUpAt) return;
      const key = dayKey(new Date(ev.nextFollowUpAt));
      (map[key] ??= []).push(ev);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt)));
    return map;
  }, [events]);

  const todayKey = dayKey(new Date());
  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shiftMonth = (delta) => setMonthDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return startOfMonth(d); });

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Team calendar</h1><p className="mt-1 text-sm text-slate-500">{hasFullAccess ? "Every scheduled call and meeting across the sales team." : "Your scheduled calls and meetings."}</p></div>
      <div className="flex items-center gap-2">
        <button onClick={() => shiftMonth(-1)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50">‹ Prev</button>
        <button onClick={() => setMonthDate(startOfMonth(new Date()))} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50">Today</button>
        <button onClick={() => shiftMonth(1)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50">Next ›</button>
        <span className="ml-2 min-w-[140px] text-sm font-semibold text-slate-800">{monthLabel}</span>
      </div>
    </header>

    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">{Object.entries(FOLLOW_UP_TYPE_LABELS).map(([type, label]) => <span key={type} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${TYPE_COLORS[type].split(" ")[0]}`}/>{label}</span>)}</div>

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{WEEKDAYS.map((w) => <div key={w} className="px-3 py-2 text-center">{w}</div>)}</div>
      {loading ? <div className="p-10 text-center text-sm text-slate-400">Loading calendar…</div> : <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = dayKey(d);
          const inMonth = d.getMonth() === monthDate.getMonth();
          const isToday = key === todayKey;
          const dayEvents = eventsByDay[key] ?? [];
          return <div key={key} className={`min-h-[112px] border-b border-r border-slate-100 p-2 last:border-r-0 ${inMonth ? "bg-white" : "bg-slate-50/60"}`}>
            <div className={`mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-blue-600 text-white" : inMonth ? "text-slate-700" : "text-slate-300"}`}>{d.getDate()}</div>
            <div className="space-y-1">{dayEvents.map((ev) => <Link key={ev.id} href={`/leads/${ev.leadId}`} title={`${ev.lead?.fullName ?? "Lead"} — ${FOLLOW_UP_TYPE_LABELS[ev.type] ?? ev.type}${hasFullAccess ? ` — ${ev.user?.name ?? ev.user?.email ?? "Unassigned"}` : ""}`} className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium hover:opacity-80 ${TYPE_COLORS[ev.type] ?? "bg-slate-100 text-slate-700"} ${ev.completedAt ? "opacity-50 line-through" : ""}`}>{new Date(ev.nextFollowUpAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {ev.lead?.fullName ?? "Lead"}{hasFullAccess && ev.user?.name ? ` (${ev.user.name})` : ""}{ev.teamsJoinUrl && !ev.completedAt ? " 🎥" : ""}</Link>)}</div>
          </div>;
        })}
      </div>}
    </div>
  </div>;
}
