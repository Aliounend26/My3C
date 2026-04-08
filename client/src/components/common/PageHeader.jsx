export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      {eyebrow ? <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-500">{eyebrow}</p> : null}
      <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
  </div>
);
