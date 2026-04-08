import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createQuiz, deleteQuiz, getQuiz, getQuizResults, getQuizzes, submitQuiz, updateQuiz } from "../controllers/quizController.js";

const router = Router();

router.use(protect);
router.get("/", getQuizzes);
router.get("/results", getQuizResults);
router.get("/:id", getQuiz);
router.post("/", authorize("superadmin", "admin", "teacher"), createQuiz);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateQuiz);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteQuiz);
router.post("/:id/submit", authorize("student"), submitQuiz);

export default router;
