import { CourseGroup } from "../models/CourseGroup.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Section } from "../models/Section.js";
import { SectionItem } from "../models/SectionItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

const ensureTeacherOwnsCourse = async (user, courseId, res) => {
  if (user.role !== "teacher") return;

  const course = await CourseGroup.findById(courseId);
  if (!course || course.teacher?.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez pas gerer les items de ce cours");
  }
};

const normalizeOrders = async (sectionId) => {
  const items = await SectionItem.find({ section: sectionId }).sort({ order: 1, createdAt: 1 });
  await Promise.all(
    items.map((item, index) => {
      if (item.order === index + 1) return Promise.resolve();
      item.order = index + 1;
      return item.save();
    })
  );
};

const populateItems = async (filter) =>
  SectionItem.find(filter)
    .populate("section course lesson quiz")
    .sort({ order: 1, createdAt: 1 });

export const getSectionItems = asyncHandler(async (req, res) => {
  const sectionId = req.params.sectionId || req.query.section;
  const filter = {};

  if (sectionId) {
    const section = await Section.findById(sectionId).select("course");
    if (!section) {
      res.status(404);
      throw new Error("Section introuvable");
    }

    if (req.user.role === "student") {
      await ensureStudentCanAccessCourse(req.user, section.course, res);
    }

    if (req.user.role === "teacher") {
      await ensureTeacherOwnsCourse(req.user, section.course, res);
    }

    filter.section = sectionId;
  }

  const items = await populateItems(filter);
  res.json(req.user.role === "student" ? items.filter((item) => item.isPublished) : items);
});

export const createSectionItem = asyncHandler(async (req, res) => {
  const { section: sectionId, type, lesson, quiz, order, isRequired, isPublished } = req.body;
  const section = await Section.findById(sectionId).select("course");
  if (!section) {
    res.status(404);
    throw new Error("Section introuvable");
  }

  await ensureTeacherOwnsCourse(req.user, section.course, res);

  if (type === "lesson") {
    const lessonDoc = await Lesson.findById(lesson);
    if (!lessonDoc || lessonDoc.section?.toString() !== sectionId.toString()) {
      res.status(400);
      throw new Error("Lecon invalide pour cette section");
    }
  }

  if (type === "quiz") {
    const quizDoc = await Quiz.findById(quiz);
    if (!quizDoc || quizDoc.section?.toString() !== sectionId.toString()) {
      res.status(400);
      throw new Error("Quiz invalide pour cette section");
    }
  }

  const item = await SectionItem.create({
    course: section.course,
    section: sectionId,
    type,
    lesson: type === "lesson" ? lesson : undefined,
    quiz: type === "quiz" ? quiz : undefined,
    order: Number(order || 1),
    isRequired: isRequired !== undefined ? Boolean(isRequired) : true,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true
  });

  await normalizeOrders(sectionId);
  res.status(201).json(await SectionItem.findById(item._id).populate("section course lesson quiz"));
});

export const updateSectionItem = asyncHandler(async (req, res) => {
  const item = await SectionItem.findById(req.params.id).populate("section");
  if (!item) {
    res.status(404);
    throw new Error("Item introuvable");
  }

  await ensureTeacherOwnsCourse(req.user, item.course, res);

  item.order = req.body.order ?? item.order;
  item.isRequired = req.body.isRequired ?? item.isRequired;
  item.isPublished = req.body.isPublished ?? item.isPublished;
  await item.save();
  await normalizeOrders(item.section._id || item.section);

  res.json(await SectionItem.findById(item._id).populate("section course lesson quiz"));
});

export const deleteSectionItem = asyncHandler(async (req, res) => {
  const item = await SectionItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item introuvable");
  }

  await ensureTeacherOwnsCourse(req.user, item.course, res);
  const sectionId = item.section;
  await SectionItem.findByIdAndDelete(item._id);
  await normalizeOrders(sectionId);
  res.json({ success: true });
});
