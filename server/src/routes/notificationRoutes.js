import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";

const router = Router();

router.use(protect);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);

export default router;
