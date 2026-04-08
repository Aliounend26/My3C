import { Router } from "express";
import { createStudent, deleteStudent, getStudentById, getStudents, updateStudent } from "../controllers/studentController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.use(authorize("admin"));
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
