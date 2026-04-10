import { BarChart3, Bell, Book, BookOpen, CalendarCheck2, CalendarDays, ClipboardList, Folder, GraduationCap, LayoutDashboard, QrCode, ScanLine, UserCircle2, Users, X } from "lucide-react";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

const iconMap = {
  dashboard: LayoutDashboard,
  formations: GraduationCap,
  classes: BookOpen,
  users: Users,
  students: Users,
  courses: CalendarCheck2,
  attendances: Users,
  qr: QrCode,
  reports: BarChart3,
  profile: UserCircle2,
  mycourses: BookOpen,
  myattendances: CalendarCheck2,
  scanner: ScanLine,
  progress: BarChart3,
  calendar: CalendarDays,
  library: BookOpen,
  book: Book,
  folder: Folder,
  quiz: ClipboardList,
  bell: Bell
};

const SidebarContent = ({ items, onNavigate, mobile = false }) => (
  <>
    <div className={`mb-5 border-b pb-5 ${mobile ? "border-slate-200" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <BrandLogo className="mb-3" />
          {mobile ? <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-600">Navigation</p> : null}
          <p className={`mt-2 leading-6 ${mobile ? "text-sm text-slate-600" : "text-sm text-slate-500"}`}>
            Plateforme e-learning, presence QR et pilotage pedagogique.
          </p>
        </div>
        {mobile ? (
          <button
            type="button"
            onClick={onNavigate}
            className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
            aria-label="Fermer le menu"
          >
          <X size={18} />
          </button>
        ) : null}
      </div>
    </div>
    <nav className={`space-y-2 ${mobile ? "overflow-y-auto pb-4" : ""}`}>
      {items.map((item) => {
        const Icon = iconMap[item.icon] || BookOpen;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : mobile
                    ? "border border-slate-200/80 bg-white text-slate-700 shadow-sm hover:border-brand-200 hover:bg-slate-50"
                    : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  </>
);

export const Sidebar = ({ items, mobileOpen = false, onClose = () => {} }) => {
  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="glass-card hidden w-72 shrink-0 p-5 lg:block">
        <SidebarContent items={items} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={onClose}
            aria-label="Fermer le menu mobile"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[360px] flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <SidebarContent items={items} onNavigate={onClose} mobile />
          </aside>
        </div>
      ) : null}
    </>
  );
};
