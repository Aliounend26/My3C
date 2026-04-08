import { Router } from "express";
import { getMe, login, updateMe, updateMyPassword, uploadMyAvatar } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { avatarUpload } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/me/password", protect, updateMyPassword);
router.post("/me/avatar", protect, avatarUpload.single("avatar"), uploadMyAvatar);

export default router;
