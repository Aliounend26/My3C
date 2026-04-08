import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import {
  createMessage,
  createTeacherClassMessage,
  createTeacherCourseMessage,
  createTeacherStudentMessage,
  getMessages,
  markMessageAsRead
} from "../controllers/messageController.js";
import { getConversation, getConversations } from "../controllers/conversationController.js";

const router = Router();

router.use(protect);
router.get("/", getMessages);
router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversation);
router.post("/teacher/student/:studentId", authorize("teacher"), createTeacherStudentMessage);
router.post("/teacher/course/:courseId", authorize("teacher"), createTeacherCourseMessage);
router.post("/teacher/class/:classId", authorize("teacher"), createTeacherClassMessage);
router.post("/", authorize("superadmin", "admin", "teacher", "student"), createMessage);
router.put("/:id/read", authorize("superadmin", "admin", "teacher", "student"), markMessageAsRead);

export default router;
