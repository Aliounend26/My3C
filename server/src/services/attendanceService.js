import { Attendance } from "../models/Attendance.js";
import { CourseSession } from "../models/CourseSession.js";
import { User } from "../models/User.js";
import { calculateAttendanceRate, getAttendanceBand, getAttendanceHours, getStatusFromScanTime } from "../utils/attendance.js";
import { getStudentAllowedCourseIds } from "../utils/studentAccess.js";

export const getStudentAttendanceSummary = async (studentId) => {
  const student = await User.findById(studentId).populate("formations");

  if (!student) {
    throw new Error("Student not found");
  }

  const allowedCourseGroupIds = await getStudentAllowedCourseIds(student);
  const formationIds = student.formations?.map((formation) => formation._id) ?? [];
  const courseFilter = {};

  if (allowedCourseGroupIds.length) {
    courseFilter.courseGroupId = { $in: allowedCourseGroupIds };
  } else if (formationIds.length) {
    courseFilter.formation = { $in: formationIds };
  }

  const [courses, attendances] = await Promise.all([
    CourseSession.find(courseFilter),
    Attendance.find({ student: student._id }).populate("course formation")
  ]);

  const totalHours = courses.reduce((sum, course) => sum + course.durationHours, 0);
  const presentHours = attendances.reduce((sum, attendance) => sum + attendance.presenceHours, 0);
  const rate = calculateAttendanceRate(presentHours, totalHours);
  const band = getAttendanceBand(rate);

  const byFormationMap = new Map();
  const byCourseMap = new Map();
  attendances.forEach((attendance) => {
    const formationId = attendance.formation?._id?.toString() ?? "unknown";
    const current = byFormationMap.get(formationId) ?? {
      formationId,
      formationName: attendance.formation?.name ?? "Formation",
      presentHours: 0,
      totalHours: 0
    };

    current.presentHours += attendance.presenceHours;
    current.totalHours += attendance.course?.durationHours ?? 0;
    byFormationMap.set(formationId, current);

    const courseId = attendance.course?._id?.toString() ?? "unknown";
    const currentCourse = byCourseMap.get(courseId) ?? {
      courseId,
      courseTitle: attendance.course?.title ?? "Cours",
      formationName: attendance.formation?.name ?? "Formation",
      totalHours: 0,
      presentHours: 0,
      sessionsCount: 0,
      attendanceCount: 0,
      presentCount: 0,
      lateCount: 0,
      absenceCount: 0,
      latestScanAt: attendance.scannedAt,
      date: attendance.course?.date || ""
    };

    currentCourse.totalHours += attendance.course?.durationHours ?? 0;
    currentCourse.presentHours += attendance.presenceHours;
    currentCourse.sessionsCount += 1;
    currentCourse.attendanceCount += 1;
    currentCourse.presentCount += attendance.status === "present" ? 1 : 0;
    currentCourse.lateCount += attendance.status === "late" ? 1 : 0;
    currentCourse.absenceCount += attendance.status === "absent" ? 1 : 0;
    currentCourse.latestScanAt = attendance.scannedAt > currentCourse.latestScanAt ? attendance.scannedAt : currentCourse.latestScanAt;
    byCourseMap.set(courseId, currentCourse);
  });

  return {
    student,
    totalHours,
    presentHours,
    rate,
    band,
    attendanceCount: attendances.length,
    absenceCount: attendances.filter((item) => item.status === "absent").length,
    byFormation: Array.from(byFormationMap.values()).map((item) => ({
      ...item,
      rate: calculateAttendanceRate(item.presentHours, item.totalHours)
    })),
    byCourse: Array.from(byCourseMap.values())
      .map((item) => ({
        ...item,
        rate: calculateAttendanceRate(item.presentHours, item.totalHours),
        band: getAttendanceBand(calculateAttendanceRate(item.presentHours, item.totalHours))
      }))
      .sort((a, b) => new Date(b.latestScanAt || 0) - new Date(a.latestScanAt || 0)),
    attendances
  };
};

export const buildAttendancePayload = (studentId, course, status, source = "manual") => ({
  student: studentId,
  course: course._id,
  formation: course.formation,
  status,
  source,
  scannedAt: new Date(),
  presenceHours: getAttendanceHours(course.durationHours, status)
});

export const buildStudentAttendancePayload = (studentId, course, scannedAt) => {
  const parsedScanTime = new Date(scannedAt);
  const status = getStatusFromScanTime(course, parsedScanTime);

  return {
    student: studentId,
    course: course._id,
    formation: course.formation,
    status,
    source: "student",
    scannedAt: parsedScanTime,
    presenceHours: getAttendanceHours(course.durationHours, status)
  };
};

export const buildQrAttendancePayload = (studentId, course, scannedAt, qrCodeId) => {
  const parsedScanTime = new Date(scannedAt);
  const status = getStatusFromScanTime(course, parsedScanTime);

  return {
    student: studentId,
    course: course._id,
    formation: course.formation,
    qrCode: qrCodeId,
    status,
    source: "qr",
    scannedAt: parsedScanTime,
    presenceHours: getAttendanceHours(course.durationHours, status)
  };
};
