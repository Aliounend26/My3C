import { BarChart3, Bell, Book, BookOpen, CalendarCheck2, CalendarDays, ClipboardList, Folder, GraduationCap, LayoutDashboard, QrCode, ScanLine, UserCircle2, Users } from "lucide-react";
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

export const Sidebar = ({ items }) => (
  <aside className="glass-card w-full p-5 lg:w-72">
    <div className="mb-6 border-b border-slate-100 pb-5">
      <BrandLogo className="mb-3" />
      <p className="text-sm leading-6 text-slate-500">Plateforme e-learning, presence QR et pilotage pedagogique.</p>
    </div>
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || BookOpen;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? "bg-brand-500 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  </aside>
);
