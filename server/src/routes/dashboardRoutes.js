import { Router } from "express";
import { getAdminDashboard, getStudentDashboard, getSuperAdminDashboard, getTeacherDashboard } from "../controllers/dashboardController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/admin", protect, authorize("admin"), getAdminDashboard);
router.get("/teacher", protect, authorize("teacher"), getTeacherDashboard);
router.get("/superadmin", protect, authorize("superadmin"), getSuperAdminDashboard);
router.get("/student", protect, authorize("student"), getStudentDashboard);

export default router;
