import clsx from "clsx";
import { formatRate, getRateAppearance } from "../../utils/attendance";

export const ProgressBadge = ({ rate }) => {
  const appearance = getRateAppearance(rate);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", appearance.badge)}>
          {appearance.label}
        </span>
        <span className="text-sm font-semibold text-slate-700">{formatRate(rate)}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className={clsx("h-3 rounded-full transition-all", appearance.bar)} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
    </div>
  );
};
