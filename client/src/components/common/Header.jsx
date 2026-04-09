import { LogOut } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "../../hooks/useAuth";
import { getMediaUrl } from "../../utils/media";
import { NotificationBell } from "./NotificationBell";

export const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  return (
    <header className="glass-card mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
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
            Déconnexion
          </span>
        </button>
      </div>
    </header>
  );
};
