import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import {
  createSectionItem,
  deleteSectionItem,
  getSectionItems,
  updateSectionItem
} from "../controllers/sectionItemController.js";

const router = Router();

router.use(protect);
router.get("/", getSectionItems);
router.post("/", authorize("superadmin", "admin", "teacher"), createSectionItem);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateSectionItem);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteSectionItem);

export default router;
