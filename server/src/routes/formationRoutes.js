import { Router } from "express";
import { createFormation, deleteFormation, getFormations, updateFormation } from "../controllers/formationController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getFormations);
router.post("/", authorize("admin"), createFormation);
router.put("/:id", authorize("admin"), updateFormation);
router.delete("/:id", authorize("admin"), deleteFormation);

export default router;
