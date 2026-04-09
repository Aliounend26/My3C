import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";
import { getMyNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../services/notificationService";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });

const priorityClasses = {
  low: "bg-slate-50 border-slate-200",
  medium: "bg-sky-50/60 border-sky-200",
  high: "bg-rose-50/70 border-rose-200"
};

const fallbackRoute = (role) => `/${role || "student"}`;

export const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      setNotifications(await getMyNotifications(100));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleOpen = async (notification) => {
    let updatedNotification = notification;

    if (!notification.isRead) {
      updatedNotification = await markNotificationAsRead(notification._id);
      setNotifications((current) => current.map((item) => (item._id === notification._id ? updatedNotification : item)));
    }

    navigate(updatedNotification.link || fallbackRoute(user?.role));
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return <Loader label="Chargement des notifications..." />;
  }

  return (
    <section className="glass-card p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">Centre de notifications</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Notifications recentes</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Retrouvez ici les messages, publications, presences, quiz et alertes utiles a votre espace.</p>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={markingAll || unreadCount === 0}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCheck size={16} />
            Tout marquer comme lu
          </span>
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{notifications.length}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Non lues</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{unreadCount}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lues</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{notifications.length - unreadCount}</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {notifications.length ? (
          notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              onClick={() => handleOpen(notification)}
              className={`w-full rounded-[28px] border px-5 py-5 text-left transition hover:border-brand-200 hover:bg-white ${priorityClasses[notification.priority] || priorityClasses.low}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="break-words text-base font-semibold text-slate-950">{notification.title}</p>
                    {!notification.isRead ? <span className="rounded-full bg-brand-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Nouveau</span> : null}
                  </div>
                  <p className="mt-2 break-words whitespace-normal text-sm text-slate-600">{notification.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <span>{formatDateTime(notification.createdAt)}</span>
                    <span>{notification.priority}</span>
                    <span>{notification.type.replaceAll("_", " ")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Bell size={16} className={notification.isRead ? "text-slate-300" : "text-brand-600"} />
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">Aucune notification pour le moment</p>
            <p className="mt-2 text-sm text-slate-500">Les prochains evenements importants apparaitront ici automatiquement.</p>
          </div>
        )}
      </div>
    </section>
  );
};
