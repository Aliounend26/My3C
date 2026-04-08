import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createClass, deleteClass, getClassById, getClasses, updateClass } from "../controllers/classController.js";

const router = Router();

router.use(protect);
router.get("/", authorize("superadmin", "admin"), getClasses);
router.post("/", authorize("superadmin", "admin"), createClass);
router.get("/:id", authorize("superadmin", "admin", "teacher"), getClassById);
router.put("/:id", authorize("superadmin", "admin"), updateClass);
router.delete("/:id", authorize("superadmin", "admin"), deleteClass);

export default router;
