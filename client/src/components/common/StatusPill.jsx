const variants = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-rose-100 text-rose-700",
  late: "bg-amber-100 text-amber-700"
};

export const StatusPill = ({ status }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${variants[status] || "bg-slate-100 text-slate-700"}`}>
    {status}
  </span>
);
