import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createSection, deleteSection, getSections, updateSection } from "../controllers/sectionController.js";
import { getLessonsBySection } from "../controllers/lessonController.js";
import { getSectionItems } from "../controllers/sectionItemController.js";

const router = Router();

router.use(protect);
router.get("/", getSections);
router.get("/:sectionId/items", getSectionItems);
router.get("/:sectionId/lessons", getLessonsBySection);
router.post("/", authorize("superadmin", "admin", "teacher"), createSection);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateSection);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteSection);

export default router;
