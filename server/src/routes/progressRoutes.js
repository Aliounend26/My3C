import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { completeLesson, getCourseProgress, getSectionProgress, getStudentProgress } from "../controllers/progressController.js";

const router = Router();

router.use(protect);
router.get("/", authorize("student", "teacher", "admin", "superadmin"), getStudentProgress);
router.post("/complete-lesson", authorize("student", "teacher", "admin", "superadmin"), completeLesson);
router.get("/sections", authorize("student", "teacher", "admin", "superadmin"), getSectionProgress);
router.get("/courses/:id/progress", authorize("student", "teacher", "admin", "superadmin"), getCourseProgress);

export default router;
