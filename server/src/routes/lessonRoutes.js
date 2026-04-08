import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createLesson, deleteLesson, getLessonById, getLessons, updateLesson } from "../controllers/lessonController.js";

const router = Router();

router.use(protect);
router.get("/", getLessons);
router.get("/:id", getLessonById);
router.post("/", authorize("superadmin", "admin", "teacher"), createLesson);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateLesson);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteLesson);

export default router;
