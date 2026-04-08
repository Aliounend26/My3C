import { Section } from "../models/Section.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { SectionItem } from "../models/SectionItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

const ensureTeacherCourseOwnership = async (user, courseId, res) => {
  if (user.role !== "teacher") return;

  const course = await CourseGroup.findById(courseId);
  if (!course || course.teacher?.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez pas manipuler cette section pour ce cours");
  }
};

export const getSections = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.course) {
    filter.course = req.query.course;
  }

  if (req.user.role === "student") {
    if (req.query.course) {
      await ensureStudentCanAccessCourse(req.user, req.query.course, res);
    } else {
      const studentCourseFilter = await buildStudentCourseFilter(req.user);
      const accessibleCourses = await CourseGroup.find(studentCourseFilter).select("_id");
      filter.course = { $in: accessibleCourses.map((course) => course._id.toString()) };
    }
  }

  const sections = await Section.find(filter).populate("course").sort({ order: 1, createdAt: -1 });
  res.json(sections);
});

export const createSection = asyncHandler(async (req, res) => {
  await ensureTeacherCourseOwnership(req.user, req.body.course, res);

  const section = await Section.create(req.body);
  res.status(201).json(await Section.findById(section._id).populate("course"));
});

export const updateSection = asyncHandler(async (req, res) => {
  const existingSection = await Section.findById(req.params.id).populate("course");
  if (!existingSection) {
    res.status(404);
    throw new Error("Section introuvable");
  }

  if (req.user.role === "teacher") {
    await ensureTeacherCourseOwnership(req.user, existingSection.course._id, res);
    if (req.body.course && req.body.course.toString() !== existingSection.course._id.toString()) {
      await ensureTeacherCourseOwnership(req.user, req.body.course, res);
    }
  }

  Object.assign(existingSection, req.body);
  await existingSection.save();

  res.json(await Section.findById(existingSection._id).populate("course"));
});

export const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id).populate("course");
  if (!section) {
    res.status(404);
    throw new Error("Section introuvable");
  }

  if (req.user.role === "teacher") {
    await ensureTeacherCourseOwnership(req.user, section.course._id, res);
  }

  await SectionItem.deleteMany({ section: section._id });
  await Section.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
