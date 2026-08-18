import { LEAD_STATUS_LABELS } from "@/lib/constants";

const COLORS = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  FOLLOW_UP: "bg-amber-100 text-amber-700",
  QUALIFIED: "bg-violet-100 text-violet-700",
  PROPOSAL: "bg-cyan-100 text-cyan-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  PROJECT_IS_OURS: "bg-emerald-100 text-emerald-700",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        COLORS[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}
