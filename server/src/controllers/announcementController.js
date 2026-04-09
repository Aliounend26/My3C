import { Announcement } from "../models/Announcement.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { getTeacherOwnedCourseIds, ensureTeacherOwnsCourse } from "../utils/teacherAccess.js";
import { createNotifications, getCourseAudience } from "../utils/notificationHelper.js";

export const getAnnouncements = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;
  if (req.query.classRoom) filter.classRoom = req.query.classRoom;

  if (req.user.role === "student") {
    if (req.query.course) {
      await ensureStudentCanAccessCourse(req.user, req.query.course, res);
    } else {
      const studentCourseFilter = await buildStudentCourseFilter(req.user);
      const accessibleCourses = await CourseGroup.find(studentCourseFilter).select("_id");
      filter.course = { $in: accessibleCourses.map((course) => course._id.toString()) };
    }
  }

  if (req.user.role === "teacher") {
    const ownedCourseIds = await getTeacherOwnedCourseIds(req.user._id);

    if (req.query.course) {
      await ensureTeacherOwnsCourse(req.user._id, req.query.course, res, "Vous ne pouvez pas consulter les annonces de ce cours");
      filter.course = req.query.course;
    } else {
      filter.course = { $in: ownedCourseIds };
    }
  }

  const announcements = await Announcement.find(filter).populate("course classRoom author").sort({ pinned: -1, createdAt: -1 });
  res.json(announcements);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, req.body.course, res, "Vous ne pouvez pas creer une annonce pour ce cours");
  }
  const announcement = await Announcement.create({ ...req.body, author: req.user._id });
  const { course, students, admins, superadmins } = await getCourseAudience(req.body.course);
  await createNotifications([
    ...students.map((student) => ({
      userId: student._id,
      role: student.role,
      type: "announcement_posted",
      priority: req.body.pinned ? "high" : "medium",
      title: announcement.title,
      message: `Nouvelle annonce publiee dans le cours ${course?.title || "concerne"}.`,
      link: `/courses/${req.body.course}`,
      metadata: { announcementId: announcement._id.toString(), courseId: req.body.course?.toString?.() || req.body.course }
    })),
    {
      userId: req.user._id,
      role: req.user.role,
      type: "announcement_posted",
      priority: "low",
      title: "Annonce publiee",
      message: `Votre annonce "${announcement.title}" est maintenant visible dans ${course?.title || "le cours"}.`,
      link: "/announcements",
      metadata: { announcementId: announcement._id.toString(), courseId: req.body.course?.toString?.() || req.body.course }
    },
    ...admins.map((admin) => ({
      userId: admin._id,
      role: admin.role,
      type: "content_published",
      priority: "low",
      title: "Annonce de cours publiee",
      message: `${req.user.firstName} ${req.user.lastName} a publie une annonce dans ${course?.title || "un cours"}.`,
      link: "/courses",
      metadata: { announcementId: announcement._id.toString(), courseId: req.body.course?.toString?.() || req.body.course }
    })),
    ...superadmins.map((superadmin) => ({
      userId: superadmin._id,
      role: superadmin.role,
      type: "activity_important",
      priority: "low",
      title: "Activite pedagogique",
      message: `Une annonce a ete publiee dans le cours ${course?.title || "concerne"}.`,
      link: "/content",
      metadata: { announcementId: announcement._id.toString(), courseId: req.body.course?.toString?.() || req.body.course }
    }))
  ]);
  res.status(201).json(await Announcement.findById(announcement._id).populate("course classRoom author"));
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const existing = await Announcement.findById(req.params.id);

  if (!existing) {
    res.status(404);
    throw new Error("Annonce introuvable");
  }

  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, req.body.course || existing.course, res, "Vous ne pouvez pas modifier cette annonce");
  }
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("course classRoom author");
  res.json(announcement);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Annonce introuvable");
  }
  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, announcement.course, res, "Vous ne pouvez pas supprimer cette annonce");
  }
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
