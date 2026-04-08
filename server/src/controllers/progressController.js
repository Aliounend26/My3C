import { Lesson } from "../models/Lesson.js";
import { SectionItem } from "../models/SectionItem.js";
import { StudentProgress } from "../models/StudentProgress.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { Section } from "../models/Section.js";
import { StudentSectionProgress } from "../models/StudentSectionProgress.js";
import { StudentCourseProgress } from "../models/StudentCourseProgress.js";
import { syncCourseProgress, syncSectionProgress } from "../utils/progressHelpers.js";

export const getStudentProgress = asyncHandler(async (req, res) => {
  const filter = { student: req.user._id };
  if (req.query.course) {
    filter.course = req.query.course;
    await ensureStudentCanAccessCourse(req.user, req.query.course, res);
  }

  const progress = await StudentProgress.find(filter).populate("course section lesson");
  res.json(progress);
});

export const completeLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.body;
  if (!lessonId) {
    res.status(400);
    throw new Error("lessonId est requis");
  }

  const lesson = await Lesson.findById(lessonId).populate("section course");
  if (!lesson) {
    res.status(404);
    throw new Error("Leçon introuvable");
  }

  if (lesson.course) {
    await ensureStudentCanAccessCourse(req.user, lesson.course._id, res);
  }

  const [completedCount, totalLessons] = await Promise.all([
    StudentProgress.countDocuments({ student: req.user._id, course: lesson.course._id, status: "completed" }),
    Lesson.countDocuments({ course: lesson.course._id, isPublished: true })
  ]);

  const progressPercent = totalLessons ? Math.round(((completedCount + 1) / totalLessons) * 100) : 100;

  const progress = await StudentProgress.findOneAndUpdate(
    { student: req.user._id, lesson: lesson._id },
    {
      course: lesson.course._id,
      section: lesson.section?._id,
      lesson: lesson._id,
      status: "completed",
      completedAt: new Date(),
      progressPercent
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const sectionProgress = await syncSectionProgress(req.user._id, lesson);
  const courseProgress = await syncCourseProgress(req.user._id, lesson.course._id, lesson.course.title);

  res.json({ progress, progressPercent, totalLessons, completedLessons: completedCount + 1, sectionProgress, courseProgress });
});

export const getCourseProgress = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  if (!courseId) {
    res.status(400);
    throw new Error("courseId est requis");
  }

  await ensureStudentCanAccessCourse(req.user, courseId, res);

  const [totalLessons, completedLessons, totalSections, completedSections] = await Promise.all([
    SectionItem.countDocuments({ course: courseId, type: "lesson", isPublished: true }),
    StudentProgress.countDocuments({ student: req.user._id, course: courseId, status: "completed" }),
    Section.countDocuments({ course: courseId, isPublished: true }),
    StudentSectionProgress.countDocuments({ student: req.user._id, course: courseId, isCompleted: true })
  ]);

  const courseProgress = await StudentCourseProgress.findOne({ student: req.user._id, course: courseId });
  const progressPercent = totalSections
    ? courseProgress?.progressPercent ?? Math.round((completedSections / totalSections) * 100)
    : totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  res.json({ courseId, totalLessons, completedLessons, totalSections, completedSections, progressPercent });
});

export const getSectionProgress = asyncHandler(async (req, res) => {
  const courseId = req.query.course;
  if (!courseId) {
    res.status(400);
    throw new Error("courseId est requis");
  }

  await ensureStudentCanAccessCourse(req.user, courseId, res);

  const sections = await Section.find({ course: courseId, isPublished: true }).sort({ order: 1, createdAt: -1 });
  const progressDocs = await StudentSectionProgress.find({ student: req.user._id, course: courseId });

  const sectionProgress = sections.map((section) => {
    const progress = progressDocs.find((item) => item.section.toString() === section._id.toString());
    return {
      ...section.toObject(),
      lessonsCompleted: progress?.lessonsCompleted ?? 0,
      totalLessons: progress?.totalLessons ?? 0,
      itemsCompleted: progress?.itemsCompleted ?? 0,
      totalItems: progress?.totalItems ?? 0,
      requiredItemsCompleted: progress?.requiredItemsCompleted ?? 0,
      totalRequiredItems: progress?.totalRequiredItems ?? 0,
      hasSectionQuiz: progress?.hasSectionQuiz ?? false,
      quizCompleted: progress?.quizCompleted ?? false,
      progressPercent: progress?.progressPercent ?? 0,
      isCompleted: progress?.isCompleted ?? false,
      completedAt: progress?.completedAt
    };
  });

  res.json(sectionProgress);
});
