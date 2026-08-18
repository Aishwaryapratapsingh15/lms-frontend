const COLORS = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
};

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        COLORS[priority] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {priority}
    </span>
  );
}
