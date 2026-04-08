import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createVideo, deleteVideo, getVideos, updateVideo } from "../controllers/videoController.js";

const router = Router();

router.use(protect);
router.get("/", getVideos);
router.post("/", authorize("superadmin", "admin", "teacher"), createVideo);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateVideo);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteVideo);

export default router;
