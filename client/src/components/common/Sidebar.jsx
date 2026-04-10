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
    <div className="mb-6 border-b border-slate-100 pb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <BrandLogo className="mb-3" />
          <p className="text-sm leading-6 text-slate-500">Plateforme e-learning, presence QR et pilotage pedagogique.</p>
        </div>
        {mobile ? (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-brand-200 hover:text-brand-600"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
    </div>
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || BookOpen;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <Icon size={18} />
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
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Fermer le menu mobile"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[86vw] max-w-[340px] flex-col bg-white/96 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur">
            <SidebarContent items={items} onNavigate={onClose} mobile />
          </aside>
        </div>
      ) : null}
    </>
  );
};
