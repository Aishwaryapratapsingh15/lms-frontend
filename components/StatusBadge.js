import { LEAD_STATUS_LABELS } from "@/lib/constants";

const COLORS = {
  NEW: "border-blue-200 bg-blue-50 text-blue-700 before:bg-blue-500",
  CONTACTED: "border-cyan-200 bg-cyan-50 text-cyan-700 before:bg-cyan-500",
  FOLLOW_UP: "border-amber-200 bg-amber-50 text-amber-700 before:bg-amber-500",
  QUALIFIED: "border-violet-200 bg-violet-50 text-violet-700 before:bg-violet-500",
  PROPOSAL: "border-indigo-200 bg-indigo-50 text-indigo-700 before:bg-indigo-500",
  WON: "border-emerald-200 bg-emerald-50 text-emerald-700 before:bg-emerald-500",
  LOST: "border-red-200 bg-red-50 text-red-700 before:bg-red-500",
  PROJECT_IS_OURS: "border-emerald-200 bg-emerald-50 text-emerald-700 before:bg-emerald-500",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full ${
        COLORS[status] ?? "border-slate-200 bg-slate-50 text-slate-700 before:bg-slate-400"
      }`}
    >
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}
