import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { resourceUpload } from "../middlewares/uploadMiddleware.js";
import { createResource, deleteResource, getResources, updateResource } from "../controllers/resourceController.js";

const router = Router();

router.use(protect);
router.get("/", getResources);
router.post("/", authorize("superadmin", "admin", "teacher"), resourceUpload.single("file"), createResource);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateResource);
router.delete("/:id", authorize("superadmin", "admin", "teacher"), deleteResource);

export default router;
