import { AuditLog } from "../models/AuditLog.js";
import { Formation } from "../models/Formation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getFormations = asyncHandler(async (req, res) => {
  res.json(await Formation.find().sort({ createdAt: -1 }));
});

export const createFormation = asyncHandler(async (req, res) => {
  const formation = await Formation.create(req.body);
  await AuditLog.create({
    action: "formation.create",
    actor: req.user._id,
    entityType: "Formation",
    entityId: formation._id,
    details: req.body
  });
  res.status(201).json(formation);
});

export const updateFormation = asyncHandler(async (req, res) => {
  res.json(await Formation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
});

export const deleteFormation = asyncHandler(async (req, res) => {
  await Formation.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
