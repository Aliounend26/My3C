import { CourseGroup } from "../models/CourseGroup.js";

const normalizeIds = (items = []) => items.map((item) => item?._id?.toString?.() || item?.toString?.()).filter(Boolean);

export const getStudentAllowedCourseIds = async (user) => {
  const assignedCourseIds = normalizeIds(user.assignedCourses);
  const formationIds = normalizeIds(user.formations);
  const classRoomIds = normalizeIds(user.classrooms);

  const filter = [];
  if (assignedCourseIds.length) {
    filter.push({ _id: { $in: assignedCourseIds } });
  }
  if (formationIds.length) {
    filter.push({ formation: { $in: formationIds } });
  }
  if (classRoomIds.length) {
    filter.push({ classRoom: { $in: classRoomIds } });
  }

  if (!filter.length) {
    return [];
  }

  const courses = await CourseGroup.find({ $or: filter }).select("_id");
  return [...new Set(courses.map((course) => course._id.toString()))];
};

export const ensureStudentCanAccessCourse = async (user, courseId, res) => {
  if (user.role !== "student") {
    return;
  }

  // Handle both ObjectId and populated objects
  const courseIdString = (courseId._id || courseId).toString();
  const allowedCourseIds = await getStudentAllowedCourseIds(user);
  if (!allowedCourseIds.includes(courseIdString)) {
    res.status(403);
    throw new Error("Vous n’avez pas accès à ce contenu");
  }
};

export const buildStudentCourseFilter = async (user) => {
  const allowedCourseIds = await getStudentAllowedCourseIds(user);
  return { _id: { $in: allowedCourseIds } };
};
