import { Router } from "express";
import { createStudent, deleteStudent, exportStudents, getStudentById, getStudents, updateStudent } from "../controllers/studentController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getStudents);
router.get("/export", authorize("admin"), exportStudents);
router.get("/:id", getStudentById);
router.use(authorize("admin"));
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
