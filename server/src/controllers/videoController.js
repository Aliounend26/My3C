import { VideoResource } from "../models/VideoResource.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { Section } from "../models/Section.js";
import { Lesson } from "../models/Lesson.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

const ensureTeacherOwnsCourse = async (user, courseId, res) => {
  if (user.role !== "teacher") return;

  const course = await CourseGroup.findById(courseId);
  if (!course || course.teacher?.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez pas modifier cette video pour ce cours");
  }
};

export const getVideos = asyncHandler(async (req, res) => {
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
      await ensureStudentCanAccessCourse(req.user, lesson.section.course._id, res);
    } else {
      const studentCourseFilter = await buildStudentCourseFilter(req.user);
      const accessibleCourses = await CourseGroup.find(studentCourseFilter).select("_id");
      filter.course = { $in: accessibleCourses.map((course) => course._id.toString()) };
    }
  }

  const videos = await VideoResource.find(filter).populate("course section lesson createdBy").sort({ createdAt: -1 });
  res.json(videos);
});

export const createVideo = asyncHandler(async (req, res) => {
  await ensureTeacherOwnsCourse(req.user, req.body.course, res);
  const video = await VideoResource.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(await VideoResource.findById(video._id).populate("course section lesson createdBy"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const existing = await VideoResource.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Video introuvable");
  }
  await ensureTeacherOwnsCourse(req.user, req.body.course || existing.course, res);
  const video = await VideoResource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
    "course section lesson createdBy"
  );
  res.json(video);
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const existing = await VideoResource.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Video introuvable");
  }
  await ensureTeacherOwnsCourse(req.user, existing.course, res);
  await VideoResource.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
