import { Announcement } from "../models/Announcement.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { getTeacherOwnedCourseIds, ensureTeacherOwnsCourse } from "../utils/teacherAccess.js";

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
