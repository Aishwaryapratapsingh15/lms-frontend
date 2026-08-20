const COLORS = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-red-200 bg-red-50 text-red-700",
};

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${
        COLORS[priority] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {priority}
    </span>
  );
}
