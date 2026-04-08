import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createUser, deleteUser, getUser, getUsers, updateUser } from "../controllers/userController.js";

const router = Router();

router.use(protect);
router.use(authorize("superadmin", "admin"));
router.get("/", getUsers);
router.post("/", createUser);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
