import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { SectionItem } from "../models/SectionItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { createNotifications, getCourseAudience } from "../utils/notificationHelper.js";

const ensureTeacherCanManageLesson = async (user, sectionId, res) => {
  if (user.role !== "teacher") return;

  const section = await Section.findById(sectionId).populate("course");
  if (!section || !section.course || section.course.teacher?.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez pas gerer cette leçon");
  }
  return section;
};

const ensureSectionMatchesCourse = async (sectionId, courseId, res) => {
  if (!sectionId) return;
  const section = await Section.findById(sectionId);
  if (!section || section.course?.toString() !== courseId.toString()) {
    res.status(400);
    throw new Error("Section invalide pour ce cours");
  }
};

export const getLessons = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.course) {
    filter.course = req.query.course;
  }
  if (req.query.section) {
    filter.section = req.query.section;
  }

  if (req.user.role === "student") {
    const courseId = req.query.course;
    const sectionId = req.query.section;
    if (!courseId && !sectionId) {
      return res.json([]);
    }

    if (courseId) {
      await ensureStudentCanAccessCourse(req.user, courseId, res);
    } else if (sectionId) {
      const section = await Section.findById(sectionId).select("course");
      if (!section) {
        res.status(404);
        throw new Error("Section introuvable");
      }
      await ensureStudentCanAccessCourse(req.user, section.course, res);
    }
  }

  const lessons = await Lesson.find(filter)
    .populate("course section video quiz teacher")
    .sort({ order: 1, createdAt: -1 });
  res.json(lessons);
});

export const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate("course section video quiz teacher");
  if (!lesson) {
    res.status(404);
    throw new Error("Lecon introuvable");
  }

  if (req.user.role === "student") {
    await ensureStudentCanAccessCourse(req.user, lesson.course._id, res);
  }

  res.json(lesson);
});

export const getLessonsByCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  if (!courseId) {
    res.status(400);
    throw new Error("courseId est requis");
  }

  if (req.user.role === "student") {
    await ensureStudentCanAccessCourse(req.user, courseId, res);
  }

  const lessons = await Lesson.find({ course: courseId, isPublished: true })
    .populate("course section video quiz teacher")
    .sort({ order: 1, createdAt: -1 });
  res.json(lessons);
});

export const getLessonsBySection = asyncHandler(async (req, res) => {
  const sectionId = req.params.sectionId;
  if (!sectionId) {
    res.status(400);
    throw new Error("sectionId est requis");
  }

  const section = await Section.findById(sectionId).populate("course");
  if (!section) {
    res.status(404);
    throw new Error("Section introuvable");
  }

  if (req.user.role === "student") {
    await ensureStudentCanAccessCourse(req.user, section.course._id, res);
  }

  const sectionItems = await SectionItem.find({ section: sectionId, type: "lesson", isPublished: true }).sort({ order: 1, createdAt: 1 });
  const lessonIds = sectionItems.map((item) => item.lesson).filter(Boolean);
  const lessons = await Lesson.find({ _id: { $in: lessonIds }, isPublished: true }).populate("course section video quiz teacher");
  const orderedLessons = lessonIds.map((lessonId) => lessons.find((lesson) => lesson._id.toString() === lessonId.toString())).filter(Boolean);
  res.json(orderedLessons);
});

export const createLesson = asyncHandler(async (req, res) => {
  const section = await ensureTeacherCanManageLesson(req.user, req.body.section, res);
  await ensureSectionMatchesCourse(req.body.section, req.body.course, res);

  const lesson = await Lesson.create({ ...req.body, teacher: req.user._id, course: section.course._id });
  await SectionItem.create({
    course: section.course._id,
    section: req.body.section,
    type: "lesson",
    lesson: lesson._id,
    order: Number(req.body.order || 1),
    isRequired: true,
    isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true
  });
  if (lesson.isPublished !== false) {
    const { course, students, admins, superadmins } = await getCourseAudience(section.course._id);
    await createNotifications([
      ...students.map((student) => ({
        userId: student._id,
        role: student.role,
        type: "lesson_published",
        priority: "medium",
        title: "Nouvelle lecon disponible",
        message: `La lecon "${lesson.title}" vient d'etre publiee dans ${course?.title || "votre cours"}.`,
        link: `/lessons/${lesson._id}`,
        metadata: { lessonId: lesson._id.toString(), sectionId: lesson.section?.toString?.() || lesson.section, courseId: lesson.course?.toString?.() || lesson.course }
      })),
      {
        userId: req.user._id,
        role: req.user.role,
        type: "lesson_published",
        priority: "low",
        title: "Lecon publiee",
        message: `La lecon "${lesson.title}" a bien ete publiee.`,
        link: "/lessons",
        metadata: { lessonId: lesson._id.toString(), courseId: lesson.course?.toString?.() || lesson.course }
      },
      ...admins.map((admin) => ({
        userId: admin._id,
        role: admin.role,
        type: "content_published",
        priority: "low",
        title: "Nouvelle lecon publiee",
        message: `${req.user.firstName} ${req.user.lastName} a publie "${lesson.title}" dans ${course?.title || "un cours"}.`,
        link: "/sections",
        metadata: { lessonId: lesson._id.toString(), courseId: lesson.course?.toString?.() || lesson.course }
      })),
      ...superadmins.map((superadmin) => ({
        userId: superadmin._id,
        role: superadmin.role,
        type: "activity_important",
        priority: "low",
        title: "Contenu pedagogique publie",
        message: `Une nouvelle lecon a ete publiee dans ${course?.title || "un cours"}.`,
        link: "/content",
        metadata: { lessonId: lesson._id.toString(), courseId: lesson.course?.toString?.() || lesson.course }
      }))
    ]);
  }
  res.status(201).json(await Lesson.findById(lesson._id).populate("course section video quiz teacher"));
});

export const updateLesson = asyncHandler(async (req, res) => {
  const existingLesson = await Lesson.findById(req.params.id).populate("section");
  if (!existingLesson) {
    res.status(404);
    throw new Error("Leçon introuvable");
  }

  if (req.user.role === "teacher") {
    const sectionId = req.body.section || existingLesson.section._id;
    await ensureTeacherCanManageLesson(req.user, sectionId, res);
    await ensureSectionMatchesCourse(req.body.section || existingLesson.section, req.body.course || existingLesson.course, res);
  }

  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
    "course section video quiz teacher"
  );
  if (!lesson) {
    res.status(404);
    throw new Error("Leçon introuvable");
  }
  await SectionItem.findOneAndUpdate(
    { lesson: lesson._id },
    {
      course: lesson.course._id || lesson.course,
      section: lesson.section?._id || lesson.section,
      type: "lesson",
      lesson: lesson._id,
      order: Number(req.body.order || lesson.order || 1),
      isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : lesson.isPublished !== false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (lesson.isPublished !== false) {
    const wasPublished = existingLesson.isPublished !== false;
    const { course, students } = await getCourseAudience(lesson.course?._id || lesson.course);
    await createNotifications([
      ...students.map((student) => ({
        userId: student._id,
        role: student.role,
        type: wasPublished ? "content_updated" : "lesson_published",
        priority: "medium",
        title: wasPublished ? "Lecon mise a jour" : "Nouvelle lecon disponible",
        message: wasPublished
          ? `La lecon "${lesson.title}" a ete mise a jour dans ${course?.title || "votre cours"}.`
          : `La lecon "${lesson.title}" vient d'etre publiee dans ${course?.title || "votre cours"}.`,
        link: `/lessons/${lesson._id}`,
        metadata: { lessonId: lesson._id.toString(), courseId: lesson.course?._id?.toString?.() || lesson.course?.toString?.() || lesson.course }
      })),
      {
        userId: req.user._id,
        role: req.user.role,
        type: "content_updated",
        priority: "low",
        title: "Lecon mise a jour",
        message: `Les modifications de "${lesson.title}" ont ete enregistrees.`,
        link: "/lessons",
        metadata: { lessonId: lesson._id.toString(), courseId: lesson.course?._id?.toString?.() || lesson.course?.toString?.() || lesson.course }
      }
    ]);
  }
  res.json(lesson);
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate("section");
  if (!lesson) {
    res.status(404);
    throw new Error("Leçon introuvable");
  }

  if (req.user.role === "teacher") {
    await ensureTeacherCanManageLesson(req.user, lesson.section._id, res);
  }

  await SectionItem.deleteOne({ lesson: lesson._id });
  await Lesson.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
