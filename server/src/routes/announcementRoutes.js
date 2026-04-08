import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from "../controllers/announcementController.js";

const router = Router();

router.use(protect);
router.get("/", getAnnouncements);
router.post("/", authorize("superadmin", "admin", "teacher"), createAnnouncement);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateAnnouncement);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteAnnouncement);

export default router;
