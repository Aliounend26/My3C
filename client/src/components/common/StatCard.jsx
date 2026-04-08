export const StatCard = ({ title, value, hint, accent = "bg-brand-500" }) => (
  <div className="glass-card p-5">
    <div className={`mb-4 h-2 w-16 rounded-full ${accent}`} />
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{hint}</p>
  </div>
);
