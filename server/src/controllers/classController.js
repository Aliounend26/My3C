import { ClassRoom } from "../models/ClassRoom.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getClasses = asyncHandler(async (req, res) => {
  const classes = await ClassRoom.find().populate("formation teacher students");
  res.json(classes);
});

export const getClassById = asyncHandler(async (req, res) => {
  const classRoom = await ClassRoom.findById(req.params.id).populate("formation teacher students");
  if (!classRoom) {
    res.status(404);
    throw new Error("Classe introuvable");
  }
  res.json(classRoom);
});

export const createClass = asyncHandler(async (req, res) => {
  const classRoom = await ClassRoom.create(req.body);
  res.status(201).json(await ClassRoom.findById(classRoom._id).populate("formation teacher students"));
});

export const updateClass = asyncHandler(async (req, res) => {
  const classRoom = await ClassRoom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
    "formation teacher students"
  );

  if (!classRoom) {
    res.status(404);
    throw new Error("Classe introuvable");
  }

  res.json(classRoom);
});

export const deleteClass = asyncHandler(async (req, res) => {
  await ClassRoom.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
