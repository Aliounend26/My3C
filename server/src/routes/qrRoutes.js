import { Router } from "express";
import { getPublicQrSession, getQrByCourse, scanQrCode } from "../controllers/qrController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/public/session", getPublicQrSession);

router.use(protect);
router.get("/:courseId", authorize("admin"), getQrByCourse);
router.post("/scan", authorize("student"), scanQrCode);

export default router;
