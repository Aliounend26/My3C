export const SortSelect = ({ value, onChange, options }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm font-medium text-slate-600">Tri</span>
    <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);
