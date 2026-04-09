import api from "./api";

export const getMyNotifications = async (limit = 50) => {
  try {
    const { data } = await api.get("/notifications", { params: { limit } });
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const { data } = await api.get("/notifications/unread-count");
    return data?.unreadCount || 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data } = await api.put(`/notifications/${notificationId}/read`);
    return data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const { data } = await api.put("/notifications/read-all");
    return data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return null;
  }
};
