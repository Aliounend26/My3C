import { LogOut, Menu } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "../../hooks/useAuth";
import { getMediaUrl } from "../../utils/media";
import { NotificationBell } from "./NotificationBell";

export const Header = ({ title, onMenuOpen = null }) => {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  return (
    <header className="glass-card mb-4 overflow-hidden p-3 sm:mb-6 sm:p-4">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuOpen ? (
            <button
              type="button"
              onClick={onMenuOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
          ) : null}
          <div className="min-w-0">
            <BrandLogo compact className="mb-1" />
            <h2 className="truncate text-base font-semibold text-slate-950">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          {user?.avatar ? (
            <img src={getMediaUrl(user.avatar)} alt={`${user.firstName} ${user.lastName}`} className="h-10 w-10 rounded-2xl object-cover ring-2 ring-white" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-500">
              {initials}
            </div>
          )}
        </div>
      </div>

      <div className="hidden items-center justify-between gap-4 lg:flex">
        <div>
          <BrandLogo compact className="mb-2" />
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {user?.avatar ? (
            <img src={getMediaUrl(user.avatar)} alt={`${user.firstName} ${user.lastName}`} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
              {initials}
            </div>
          )}
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user?.role}</p>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" onClick={logout}>
            <span className="flex items-center gap-2">
              <LogOut size={16} />
              Deconnexion
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
