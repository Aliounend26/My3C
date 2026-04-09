import path from "path";
import { fileURLToPath } from "url";
import { CourseMaterial } from "../models/CourseMaterial.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { Section } from "../models/Section.js";
import { Lesson } from "../models/Lesson.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { createNotifications, getCourseAudience } from "../utils/notificationHelper.js";

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

const resolveResourceContext = async ({ course, section, lesson }) => {
  let resolvedCourse = course || "";
  let resolvedSection = section || "";
  let resolvedLesson = lesson || "";

  if (resolvedLesson) {
    const lessonDoc = await Lesson.findById(resolvedLesson).populate("section");
    if (!lessonDoc) {
      throw new Error("Leçon introuvable");
    }

    resolvedSection = lessonDoc.section?._id?.toString() || lessonDoc.section?.toString?.() || resolvedSection;
    resolvedCourse =
      lessonDoc.course?._id?.toString() ||
      lessonDoc.course?.toString?.() ||
      lessonDoc.section?.course?._id?.toString() ||
      lessonDoc.section?.course?.toString?.() ||
      resolvedCourse;
  } else if (resolvedSection && !resolvedCourse) {
    const sectionDoc = await Section.findById(resolvedSection).select("course");
    if (!sectionDoc) {
      throw new Error("Chapitre introuvable");
    }
    resolvedCourse = sectionDoc.course?.toString() || "";
  }

  return {
    course: resolvedCourse,
    section: resolvedSection,
    lesson: resolvedLesson
  };
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
  const resolvedContext = await resolveResourceContext(req.body);
  if (!resolvedContext.course) {
    res.status(400);
    throw new Error("Le cours de rattachement est introuvable pour cette ressource");
  }

  await ensureTeacherOwnsCourse(req.user, resolvedContext.course, res);
  const filePath = req.file ? `/uploads/resources/${req.file.filename}` : "";
  const resource = await CourseMaterial.create({
    ...req.body,
    ...resolvedContext,
    filePath,
    url: req.body.url || filePath,
    createdBy: req.user._id
  });
  const { course, students, admins, superadmins } = await getCourseAudience(resolvedContext.course);
  await createNotifications([
    ...students.map((student) => ({
      userId: student._id,
      role: student.role,
      type: "resource_added",
      priority: "medium",
      title: "Nouvelle ressource disponible",
      message: `La ressource "${resource.title}" a ete ajoutee dans ${course?.title || "votre cours"}.`,
      link: `/courses/${resolvedContext.course}`,
      metadata: {
        resourceId: resource._id.toString(),
        courseId: resolvedContext.course,
        sectionId: resolvedContext.section,
        lessonId: resolvedContext.lesson
      }
    })),
    {
      userId: req.user._id,
      role: req.user.role,
      type: "resource_added",
      priority: "low",
      title: "Ressource ajoutee",
      message: `La ressource "${resource.title}" a bien ete ajoutee.`,
      link: "/resources",
      metadata: { resourceId: resource._id.toString(), courseId: resolvedContext.course }
    },
    ...admins.map((admin) => ({
      userId: admin._id,
      role: admin.role,
      type: "content_published",
      priority: "low",
      title: "Nouvelle ressource pedagogique",
      message: `${req.user.firstName} ${req.user.lastName} a ajoute une ressource dans ${course?.title || "un cours"}.`,
      link: "/courses",
      metadata: { resourceId: resource._id.toString(), courseId: resolvedContext.course }
    })),
    ...superadmins.map((superadmin) => ({
      userId: superadmin._id,
      role: superadmin.role,
      type: "activity_important",
      priority: "low",
      title: "Ressource publiee",
      message: `Une ressource a ete ajoutee dans ${course?.title || "un cours"}.`,
      link: "/content",
      metadata: { resourceId: resource._id.toString(), courseId: resolvedContext.course }
    }))
  ]);
  res.status(201).json(await CourseMaterial.findById(resource._id).populate("course section lesson createdBy"));
});

export const updateResource = asyncHandler(async (req, res) => {
  const existing = await CourseMaterial.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Ressource introuvable");
  }
  const resolvedContext = await resolveResourceContext({
    course: req.body.course || existing.course?.toString(),
    section: req.body.section || existing.section?.toString(),
    lesson: req.body.lesson || existing.lesson?.toString()
  });
  await ensureTeacherOwnsCourse(req.user, resolvedContext.course || existing.course, res);
  const resource = await CourseMaterial.findByIdAndUpdate(req.params.id, { ...req.body, ...resolvedContext }, { new: true, runValidators: true }).populate(
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
