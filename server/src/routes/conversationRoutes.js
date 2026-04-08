import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createConversation, getConversation, getConversations } from "../controllers/conversationController.js";

const router = Router();

router.use(protect);
router.get("/", authorize("student", "teacher", "admin", "superadmin"), getConversations);
router.get("/:id", authorize("student", "teacher", "admin", "superadmin"), getConversation);
router.post("/", authorize("student", "teacher", "admin", "superadmin"), createConversation);

export default router;
