const sizeClasses = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl"
};

export const Modal = ({ open, title, children, onClose, size = "md" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className={`glass-card flex max-h-[92vh] w-full flex-col overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}>
        <div className="mb-0 flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <button className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};
