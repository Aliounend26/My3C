export const getRateAppearance = (rate) => {
  if (rate >= 90) {
    return {
      badge: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
      label: "Excellent"
    };
  }

  if (rate >= 75) {
    return {
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
      label: "Bon"
    };
  }

  if (rate >= 50) {
    return {
      badge: "bg-orange-100 text-orange-700",
      bar: "bg-orange-400",
      label: "Moyen"
    };
  }

  return {
    badge: "bg-rose-100 text-rose-700",
    bar: "bg-rose-500",
    label: "Faible"
  };
};

export const formatRate = (rate) => `${Number(rate || 0).toFixed(1)}%`;
