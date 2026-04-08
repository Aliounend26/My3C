import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification introuvable");
  }

  res.json(notification);
});
