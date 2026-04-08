import { Router } from "express";
import {
  createCourse,
  createCourseGroup,
  createCourseRange,
  createGroupSession,
  deleteCourse,
  getCourseGroupDetail,
  getCourseGroups,
  getCourseGroupSessions,
  getCourseGroupStudents,
  getCourses,
  updateCourseGroup,
  updateCourseGroupStudents,
  updateCourse
} from "../controllers/courseController.js";
import { getMyAttendanceForCourse } from "../controllers/attendanceController.js";
import { getLessonsByCourse } from "../controllers/lessonController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getCourses);
router.get("/groups", getCourseGroups);
router.get("/groups/:groupId", getCourseGroupDetail);
router.get("/groups/:groupId/sessions", getCourseGroupSessions);
router.get("/groups/:groupId/students", authorize("admin"), getCourseGroupStudents);
router.post("/", authorize("admin"), createCourse);
router.post("/groups", authorize("admin"), createCourseGroup);
router.post("/groups/:groupId/sessions", authorize("admin"), createGroupSession);
router.put("/groups/:groupId", authorize("admin"), updateCourseGroup);
router.put("/groups/:groupId/students", authorize("admin"), updateCourseGroupStudents);
router.post("/range", authorize("admin"), createCourseRange);
router.get("/:courseId/attendances/me", authorize("student"), getMyAttendanceForCourse);
router.get("/:courseId/lessons", getLessonsByCourse);
router.put("/:id", authorize("admin"), updateCourse);
router.delete("/:id", authorize("admin"), deleteCourse);

export default router;
