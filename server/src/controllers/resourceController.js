import path from "path";
import { fileURLToPath } from "url";
import { CourseMaterial } from "../models/CourseMaterial.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { Section } from "../models/Section.js";
import { Lesson } from "../models/Lesson.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureTeacherOwnsCourse = async (user, courseId, res) => {
  if (user.role !== "teacher") return;

  const course = await CourseGroup.findById(courseId);
  if (!course || course.teacher?.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez pas modifier ce contenu pour ce cours");
  }
};

export const getResources = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;
  if (req.query.section) filter.section = req.query.section;
  if (req.query.lesson) filter.lesson = req.query.lesson;

  if (req.user.role === "student") {
    if (req.query.course) {
      await ensureStudentCanAccessCourse(req.user, req.query.course, res);
    } else if (req.query.section) {
      const section = await Section.findById(req.query.section).select("course");
      if (!section) return res.json([]);
      await ensureStudentCanAccessCourse(req.user, section.course, res);
    } else if (req.query.lesson) {
      const lesson = await Lesson.findById(req.query.lesson).populate("section");
      if (!lesson?.section?.course) return res.json([]);
      await ensureStudentCanAccessCourse(req.user, lesson.section.course, res);
    } else {
      const studentCourseFilter = await buildStudentCourseFilter(req.user);
      const accessibleCourses = await CourseGroup.find(studentCourseFilter).select("_id");
      filter.course = { $in: accessibleCourses.map((course) => course._id.toString()) };
    }
  }

  const resources = await CourseMaterial.find(filter).populate("course section lesson createdBy").sort({ createdAt: -1 });
  res.json(resources);
});

export const createResource = asyncHandler(async (req, res) => {
  await ensureTeacherOwnsCourse(req.user, req.body.course, res);
  const filePath = req.file ? `/uploads/resources/${req.file.filename}` : "";
  const resource = await CourseMaterial.create({
    ...req.body,
    filePath,
    url: req.body.url || filePath,
    createdBy: req.user._id
  });
  res.status(201).json(await CourseMaterial.findById(resource._id).populate("course section lesson createdBy"));
});

export const updateResource = asyncHandler(async (req, res) => {
  const existing = await CourseMaterial.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Ressource introuvable");
  }
  await ensureTeacherOwnsCourse(req.user, req.body.course || existing.course, res);
  const resource = await CourseMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
    "course section lesson createdBy"
  );
  res.json(resource);
});

export const deleteResource = asyncHandler(async (req, res) => {
  const existing = await CourseMaterial.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Ressource introuvable");
  }
  await ensureTeacherOwnsCourse(req.user, existing.course, res);
  await CourseMaterial.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
