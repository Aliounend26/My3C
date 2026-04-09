import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../../services/notificationService";
import { ErrorBoundary } from "./ErrorBoundary";

const formatDateTime = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch {
    return "";
  }
};

const priorityStyles = {
  low: "border-slate-200 bg-slate-50",
  medium: "border-sky-200 bg-sky-50/60",
  high: "border-rose-200 bg-rose-50/70"
};

const getNotificationsRoute = (role) => {
  if (!role) return "/notifications";
  return `/${role}/notifications`;
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [portalElement, setPortalElement] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 360, maxWidth: "calc(100vw - 2rem)" });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [items, count] = await Promise.all([getMyNotifications(12), getUnreadNotificationCount()]);
      // Ensure items is always an array
      const safeItems = Array.isArray(items) ? items : [];
      setNotifications(safeItems);
      setUnreadCount(typeof count === "number" ? count : 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const portal = document.createElement("div");
    document.body.appendChild(portal);
    setPortalElement(portal);

    return () => {
      document.body.removeChild(portal);
    };
  }, []);

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.right - width), window.innerWidth - width - 16);
    const top = rect.bottom + 12;

    setDropdownStyle({ top, left, width, maxWidth: "calc(100vw - 2rem)" });
  };

  useEffect(() => {
    if (!open) return undefined;

    updateDropdownPosition();
    const handleResize = () => updateDropdownPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (
        !wrapperRef.current?.contains(event.target) &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const recentNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) {
      return [];
    }
    return notifications.slice(0, 8);
  }, [notifications]);

  const handleOpenNotification = useCallback(async (notification) => {
    // Validate notification object
    if (!notification || typeof notification !== "object") {
      console.error("Invalid notification object:", notification);
      return;
    }

    const notificationId = notification._id || notification.id;
    if (!notificationId) {
      console.error("Notification missing ID:", notification);
      return;
    }

    try {
      if (!notification.isRead) {
        const updated = await markNotificationAsRead(notificationId);
        if (updated) {
          setNotifications((current) => {
            if (!Array.isArray(current)) return current;
            return current.map((item) => {
              const itemId = item._id || item.id;
              return itemId === notificationId ? { ...item, ...updated, isRead: true } : item;
            });
          });
          setUnreadCount((current) => Math.max(current - 1, 0));
        }
      }
    } catch (error) {
      console.error("Error opening notification:", error);
    } finally {
      setOpen(false);
      const route = notification.link || getNotificationsRoute(user?.role);
      if (route) {
        navigate(route);
      }
    }
  }, [user?.role, navigate]);

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll) return;
    
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => {
        if (!Array.isArray(current)) return [];
        return current.map((item) => ({
          ...item,
          isRead: true
        }));
      });
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        ref={triggerRef}
        className="relative rounded-full bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        onClick={() => setOpen((current) => !current)}
        aria-label="Ouvrir les notifications"
      >
        <Bell size={18} />
        {typeof unreadCount === "number" && unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open && portalElement ? (
        <ErrorBoundary
          fallback={
            <div className="fixed z-[9999] rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              Erreur lors du chargement des notifications
            </div>
          }
        >
          {createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.16)]"
              style={{
                top: dropdownStyle?.top || 0,
                left: dropdownStyle?.left || 0,
                width: dropdownStyle?.width || 360,
                maxWidth: dropdownStyle?.maxWidth || "calc(100vw - 2rem)"
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Notifications</p>
                  <p className="text-xs text-slate-500">{typeof unreadCount === "number" ? unreadCount : 0} non lue(s)</p>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll || unreadCount === 0}
                  className="text-xs font-semibold text-brand-600 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <span className="inline-flex items-center gap-1">
                    <CheckCheck size={14} />
                    Tout lire
                  </span>
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto px-3 py-3">
                {loading ? (
                  <p className="px-2 py-6 text-center text-sm text-slate-500">Chargement des notifications...</p>
                ) : Array.isArray(recentNotifications) && recentNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {recentNotifications.map((notification, index) => {
                      // Validate each notification item
                      if (!notification || typeof notification !== "object") {
                        return null;
                      }
                      
                      const notificationId = notification._id || notification.id || `notif-${index}`;
                      const notificationTitle = notification.title || "Notification";
                      const notificationMessage = notification.message || "";
                      const notificationPriority = notification.priority || "low";
                      const isRead = notification.isRead === true;

                      return (
                        <button
                          key={notificationId}
                          type="button"
                          onClick={() => handleOpenNotification(notification)}
                          className={`w-full rounded-3xl border px-4 py-4 text-left transition hover:border-brand-200 hover:bg-white ${
                            priorityStyles[notificationPriority] || priorityStyles.low
                          } ${isRead ? "opacity-80" : "shadow-sm"}`}
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-slate-900">{notificationTitle}</p>
                              {notificationMessage ? (
                                <p className="mt-1 break-words whitespace-normal text-sm text-slate-600">{notificationMessage}</p>
                              ) : null}
                              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{formatDateTime(notification.createdAt)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {!isRead ? <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> : null}
                              <ChevronRight size={16} className="text-slate-400" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-800">Aucune notification</p>
                    <p className="mt-1 text-sm text-slate-500">Les nouveaux événements importants apparaîtront ici.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(getNotificationsRoute(user?.role));
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Voir toutes les notifications
                </button>
              </div>
            </div>,
            portalElement
          )}
        </ErrorBoundary>
      ) : null}
    </div>
  );
};
