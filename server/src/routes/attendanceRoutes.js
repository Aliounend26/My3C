import { Router } from "express";
import {
  createManualAttendance,
  createStudentAttendance,
  exportAttendances,
  getAttendances,
  getStudentSummary,
  scanAttendance,
  updateAttendance
} from "../controllers/attendanceController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", authorize("superadmin", "admin"), getAttendances);
router.get("/export", authorize("superadmin", "admin"), exportAttendances);
router.post("/manual", authorize("superadmin", "admin"), createManualAttendance);
router.post("/scan", authorize("student"), scanAttendance);
router.post("/student", authorize("student"), createStudentAttendance);
router.put("/:id", authorize("superadmin", "admin"), updateAttendance);
router.get("/student", authorize("student"), getStudentSummary);
router.get("/me", authorize("student"), getStudentSummary);
router.get("/summary/:studentId?", authorize("student", "admin", "superadmin"), getStudentSummary);

export default router;
