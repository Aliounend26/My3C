import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getNotifications, markNotificationRead } from "../controllers/notificationController.js";

const router = Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/:id/read", markNotificationRead);

export default router;
