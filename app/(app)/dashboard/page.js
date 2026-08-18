"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api/leads";

// Matches LeadsService.dashboardSummary()'s actual return shape — a fixed
// set of metrics, not a count per LeadStatus.
const METRICS = [
  { key: "totalLeads", label: "Total leads" },
  { key: "newLeads", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "won", label: "Won" },
  { key: "assignedWithSales", label: "Assigned to sales" },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {METRICS.map(({ key, label }) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-semibold text-slate-900">{data[key] ?? 0}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
