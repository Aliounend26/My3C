export const Loader = ({ label = "Chargement..." }) => (
  <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white/70 p-10 text-slate-500">
    <div className="flex items-center gap-3">
      <div className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
      <span>{label}</span>
    </div>
  </div>
);
