import { CourseGroup } from "../models/CourseGroup.js";

export const getTeacherOwnedCourseIds = async (teacherId) => {
  const courses = await CourseGroup.find({ teacher: teacherId }).select("_id");
  return courses.map((course) => course._id.toString());
};

export const ensureTeacherOwnsCourse = async (teacherId, courseId, res, message = "Acces refuse a ce cours") => {
  const course = await CourseGroup.findById(courseId).select("_id teacher");

  if (!course || course.teacher?.toString() !== teacherId.toString()) {
    res.status(403);
    throw new Error(message);
  }

  return course;
};
