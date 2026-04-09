import { Attendance } from "../models/Attendance.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { CourseSession } from "../models/CourseSession.js";
import { Formation } from "../models/Formation.js";
import { Quiz } from "../models/Quiz.js";
import { QuizResult } from "../models/QuizResult.js";
import { User } from "../models/User.js";
import { Section } from "../models/Section.js";
import { ClassRoom } from "../models/ClassRoom.js";
import { Announcement } from "../models/Announcement.js";
import { CourseMaterial } from "../models/CourseMaterial.js";
import { Message } from "../models/Message.js";
import { VideoResource } from "../models/VideoResource.js";
import { calculateAttendanceRate } from "../utils/attendance.js";
import { getTeacherOwnedCourseIds } from "../utils/teacherAccess.js";

const toId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toString === "function" && value.toString() !== "[object Object]") return value.toString();
  if (value._id) return toId(value._id);
  return "";
};

export const getAdminDashboardData = async () => {
  const [students, teachers, formations, classes, courseGroups, courses, attendances, quizResults] = await Promise.all([
    User.find({ role: "student" }).populate("formations classrooms assignedCourses"),
    User.find({ role: "teacher" }),
    Formation.find(),
    ClassRoom.find().populate("formation teacher students"),
    CourseGroup.find().populate("formation teacher classRoom").sort({ createdAt: -1 }),
    CourseSession.find().populate("formation"),
    Attendance.find().populate("student formation course").sort({ scannedAt: -1 }),
    QuizResult.find().populate("student quiz").sort({ completedAt: -1 })
  ]);

  const totalScheduledHours = courses.reduce((sum, course) => sum + course.durationHours, 0);
  const totalPresenceHours = attendances.reduce((sum, attendance) => sum + attendance.presenceHours, 0);
  const globalRate = calculateAttendanceRate(totalPresenceHours, totalScheduledHours * Math.max(students.length, 1));

  const studentStats = students.map((student) => {
    const scheduled = courses
      .filter((course) => student.formations?.some((formation) => formation._id?.toString() === course.formation?._id?.toString()))
      .reduce((sum, course) => sum + course.durationHours, 0);
    const present = attendances
      .filter((attendance) => attendance.student?._id?.toString() === student._id.toString())
      .reduce((sum, attendance) => sum + attendance.presenceHours, 0);

    return {
      studentId: student._id,
      fullName: `${student.firstName} ${student.lastName}`,
      rate: calculateAttendanceRate(present, scheduled),
      formation: student.formations?.map((formation) => formation.name).join(", ") || "-"
    };
  });

  const sorted = [...studentStats].sort((a, b) => b.rate - a.rate);
  const monthlyMap = new Map();

  attendances.forEach((attendance) => {
    const month = new Date(attendance.scannedAt).toISOString().slice(0, 7);
    const current = monthlyMap.get(month) ?? { month, present: 0, late: 0, absent: 0 };
    current[attendance.status] += 1;
    monthlyMap.set(month, current);
  });

  const byFormation = formations.map((formation) => {
    const formationStudents = students.filter((student) => student.formations?.some((item) => item._id?.toString() === formation._id.toString()));
    const formationCourses = courses.filter((course) => course.formation?._id?.toString() === formation._id.toString());
    const formationAttendances = attendances.filter((attendance) => attendance.formation?._id?.toString() === formation._id.toString());
    const totalHours = formationCourses.reduce((sum, course) => sum + course.durationHours, 0) * Math.max(formationStudents.length, 1);
    const presentHours = formationAttendances.reduce((sum, attendance) => sum + attendance.presenceHours, 0);

    return {
      name: formation.name,
      rate: calculateAttendanceRate(presentHours, totalHours)
    };
  });

  const recentAttendances = attendances.slice(0, 6);
  const recentAbsences = attendances.filter((attendance) => attendance.status === "absent").slice(0, 6);
  const activeCourses = courseGroups
    .map((group) => ({
      ...group.toObject(),
      sessionCount: courses.filter((course) => course.courseGroupId === group._id.toString()).length
    }))
    .slice(0, 6);
  const recentActivities = [
    ...recentAttendances.slice(0, 3).map((attendance) => ({
      id: `attendance-${attendance._id}`,
      type: "Presence",
      title: `${attendance.student?.firstName || ""} ${attendance.student?.lastName || ""}`.trim(),
      subtitle: `${attendance.course?.title || "Cours"} · ${attendance.status}`,
      createdAt: attendance.scannedAt || attendance.createdAt
    })),
    ...quizResults.slice(0, 3).map((result) => ({
      id: `quiz-${result._id}`,
      type: "Quiz",
      title: `${result.student?.firstName || ""} ${result.student?.lastName || ""}`.trim() || "Soumission quiz",
      subtitle: `${result.score}/${result.maxScore}`,
      createdAt: result.completedAt || result.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  return {
    cards: {
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      formations: formations.length,
      courses: courseGroups.length,
      globalRate
    },
    topStudents: sorted.slice(0, 5),
    lowStudents: [...sorted].reverse().slice(0, 5),
    monthlyPresence: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    byFormation,
    todayCourses: courses.filter((course) => course.date === new Date().toISOString().slice(0, 10)),
    activeCourses,
    recentAttendances,
    recentAbsences,
    recentActivities
  };
};

export const getTeacherDashboardData = async (teacherId) => {
  const teacherCourseIds = await getTeacherOwnedCourseIds(teacherId);

  const [courses, sections, quizzes, announcements, attendances, resources, messages] = await Promise.all([
    CourseGroup.find({ teacher: teacherId }).populate("formation classRoom teacher"),
    Section.find({ course: { $in: teacherCourseIds } }).populate("course"),
    Quiz.find({ course: { $in: teacherCourseIds } }).populate("course"),
    Announcement.find({ course: { $in: teacherCourseIds } }).populate("course classRoom author"),
    Attendance.find().populate("course formation student"),
    CourseMaterial.find({ course: { $in: teacherCourseIds } }).populate("course section lesson createdBy"),
    Message.find({ from: teacherId }).populate("from to course")
  ]);

  const normalizedTeacherCourseIds = courses.map((course) => course._id.toString());
  const teacherSections = sections.filter((section) => normalizedTeacherCourseIds.includes(toId(section.course)));
  const teacherQuizzes = quizzes.filter((quiz) => normalizedTeacherCourseIds.includes(toId(quiz.course)));
  const teacherQuizIds = teacherQuizzes.map((quiz) => quiz._id.toString());
  const [teacherQuizResults, teacherSessions] = await Promise.all([
    QuizResult.find({ quiz: { $in: teacherQuizIds } }).populate({
      path: "quiz",
      populate: { path: "course" }
    }).populate("student"),
    Attendance.find().populate("course formation student")
  ]);
  const teacherAnnouncements = announcements.filter((announcement) => normalizedTeacherCourseIds.includes(toId(announcement.course)));
  const teacherAttendanceRows = teacherSessions.filter((attendance) => normalizedTeacherCourseIds.includes(toId(attendance.course?.courseGroupId)));
  const teacherResources = resources.filter((resource) => normalizedTeacherCourseIds.includes(toId(resource.course)));
  const teacherMessages = messages.filter((message) => normalizedTeacherCourseIds.includes(toId(message.course)));
  const linkedClassrooms = courses.map((course) => course.classRoom).filter(Boolean);
  const studentIds = new Set(linkedClassrooms.flatMap((classRoom) => classRoom.students?.map((studentId) => studentId.toString()) || []));
  const averageSuccessRate = teacherQuizResults.length
    ? Number(
        (
          teacherQuizResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) /
          teacherQuizResults.length
        ).toFixed(1)
      )
    : 0;

  return {
    cards: {
      courses: courses.length,
      students: studentIds.size,
      sections: teacherSections.length,
      quizzes: teacherQuizzes.length,
      announcements: teacherAnnouncements.length,
      averageSuccessRate
    },
    latestCourses: courses.slice(0, 5),
    latestResources: teacherResources.slice(0, 5),
    latestQuizzes: teacherQuizzes.slice(0, 5),
    latestMessages: teacherMessages.slice(0, 5),
    attendanceSummary: {
      present: teacherAttendanceRows.filter((attendance) => attendance.status === "present").length,
      late: teacherAttendanceRows.filter((attendance) => attendance.status === "late").length,
      absent: teacherAttendanceRows.filter((attendance) => attendance.status === "absent").length
    },
    announcements: teacherAnnouncements.slice(0, 5),
    studentPerformance: teacherQuizResults.slice(0, 8).map((result) => ({
      id: result._id,
      studentName: `${result.student?.firstName || ""} ${result.student?.lastName || ""}`.trim(),
      quizTitle: result.quiz?.title || "Quiz",
      score: result.score,
      maxScore: result.maxScore,
      rate: result.maxScore ? Number(((result.score / result.maxScore) * 100).toFixed(1)) : 0,
      completedAt: result.completedAt
    }))
  };
};

export const getSuperAdminDashboardData = async () => {
  const [
    users,
    formations,
    courseGroups,
    sessions,
    sections,
    quizzes,
    quizResults,
    classes,
    announcements,
    resources,
    messages,
    videos,
    attendances
  ] = await Promise.all([
    User.find().populate("formations classrooms assignedCourses").sort({ createdAt: -1 }),
    Formation.find().sort({ createdAt: -1 }),
    CourseGroup.find().populate("formation teacher classRoom").sort({ createdAt: -1 }),
    CourseSession.find().populate("formation").sort({ date: -1 }),
    Section.find().populate("course").sort({ createdAt: -1 }),
    Quiz.find().populate("course").sort({ createdAt: -1 }),
    QuizResult.find().populate("quiz student").sort({ completedAt: -1 }),
    ClassRoom.find().populate("formation students").sort({ createdAt: -1 }),
    Announcement.find().populate("course author").sort({ pinned: -1, createdAt: -1 }),
    CourseMaterial.find().populate("course section createdBy").sort({ createdAt: -1 }),
    Message.find().populate("from to course").sort({ createdAt: -1 }),
    VideoResource.find().populate("course section lesson").sort({ createdAt: -1 }),
    Attendance.find().populate("student formation course").sort({ scannedAt: -1 })
  ]);

  const countsByRole = users.reduce(
    (acc, user) => ({
      ...acc,
      [user.role]: (acc[user.role] || 0) + 1
    }),
    {}
  );

  const totalScheduledHours = sessions.reduce((sum, course) => sum + course.durationHours, 0);
  const totalPresenceHours = attendances.reduce((sum, attendance) => sum + attendance.presenceHours, 0);
  const globalRate = calculateAttendanceRate(totalPresenceHours, totalScheduledHours * Math.max(countsByRole.student || 1, 1));
  const attendanceStatusCounts = attendances.reduce(
    (acc, attendance) => ({
      ...acc,
      [attendance.status]: (acc[attendance.status] || 0) + 1
    }),
    { present: 0, late: 0, absent: 0 }
  );
  const averageQuizScore = quizResults.length
    ? Number(
        (
          quizResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) /
          quizResults.length
        ).toFixed(1)
      )
    : 0;

  const monthlyMap = new Map();
  attendances.forEach((attendance) => {
    const month = new Date(attendance.scannedAt || attendance.createdAt || Date.now()).toISOString().slice(0, 7);
    const current = monthlyMap.get(month) ?? { month, present: 0, late: 0, absent: 0 };
    current[attendance.status] += 1;
    monthlyMap.set(month, current);
  });

  const formationStats = formations.map((formation) => {
    const formationId = formation._id.toString();
    const formationStudents = users.filter((user) => user.role === "student" && user.formations?.some((item) => item._id?.toString() === formationId));
    const formationCourses = courseGroups.filter((course) => course.formation?._id?.toString() === formationId || course.formation?.toString?.() === formationId);
    const formationAttendances = attendances.filter((attendance) => attendance.formation?._id?.toString() === formationId || attendance.formation?.toString?.() === formationId);
    const formationPresenceHours = formationAttendances.reduce((sum, attendance) => sum + attendance.presenceHours, 0);
    const formationScheduledHours = sessions
      .filter((session) => session.formation?._id?.toString() === formationId || session.formation?.toString?.() === formationId)
      .reduce((sum, session) => sum + session.durationHours, 0);

    return {
      id: formation._id,
      name: formation.name,
      students: formationStudents.length,
      courses: formationCourses.length,
      rate: calculateAttendanceRate(formationPresenceHours, formationScheduledHours * Math.max(formationStudents.length, 1))
    };
  });

  const courseStats = courseGroups.slice(0, 8).map((course) => {
    const courseId = course._id.toString();
    const courseStudents = users.filter(
      (user) =>
        user.role === "student" &&
        ((user.assignedCourses || []).some((item) => (item._id || item).toString() === courseId) ||
          (user.classrooms || []).some((item) => (item._id || item).toString() === (course.classRoom?._id || course.classRoom)?.toString()))
    );
    const courseQuizzes = quizzes.filter((quiz) => quiz.course?._id?.toString() === courseId || quiz.course?.toString?.() === courseId);
    const courseQuizIds = courseQuizzes.map((quiz) => quiz._id.toString());
    const courseResults = quizResults.filter((result) => courseQuizIds.includes(result.quiz?._id?.toString?.() || result.quiz?.toString?.()));
    const courseAverage = courseResults.length
      ? Number(
          (
            courseResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) /
            courseResults.length
          ).toFixed(1)
        )
      : 0;

    return {
      id: course._id,
      title: course.title,
      teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : course.instructor || "-",
      students: courseStudents.length,
      sections: sections.filter((section) => section.course?._id?.toString() === courseId || section.course?.toString?.() === courseId).length,
      resources: resources.filter((resource) => resource.course?._id?.toString() === courseId || resource.course?.toString?.() === courseId).length,
      quizzes: courseQuizzes.length,
      averageQuizRate: courseAverage
    };
  });

  const teacherStats = users
    .filter((user) => user.role === "teacher")
    .map((teacher) => {
      const teacherId = teacher._id.toString();
      const teacherCourses = courseGroups.filter((course) => course.teacher?._id?.toString() === teacherId || course.teacher?.toString?.() === teacherId);
      const teacherCourseIds = teacherCourses.map((course) => course._id.toString());
      const teacherQuizIds = quizzes
        .filter((quiz) => teacherCourseIds.includes(quiz.course?._id?.toString?.() || quiz.course?.toString?.()))
        .map((quiz) => quiz._id.toString());
      const teacherResults = quizResults.filter((result) => teacherQuizIds.includes(result.quiz?._id?.toString?.() || result.quiz?.toString?.()));

      return {
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        courses: teacherCourses.length,
        quizzes: teacherQuizIds.length,
        averageQuizRate: teacherResults.length
          ? Number(
              (
                teacherResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) /
                teacherResults.length
              ).toFixed(1)
            )
          : 0
      };
    })
    .sort((a, b) => b.courses - a.courses)
    .slice(0, 8);

  const recentUsers = users.slice(0, 6).map((user) => ({
    id: user._id,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  }));

  const inactiveUsers = users.filter((user) => user.role !== "superadmin" && !user.isActive).length;
  const alerts = [
    attendanceStatusCounts.absent > 0
      ? {
          id: "attendance-alert",
          level: "warning",
          title: "Absences a surveiller",
          description: `${attendanceStatusCounts.absent} absences ont ete enregistrees sur la plateforme.`
        }
      : null,
    inactiveUsers > 0
      ? {
          id: "inactive-users",
          level: "info",
          title: "Comptes desactives",
          description: `${inactiveUsers} comptes utilisateurs sont actuellement desactives.`
        }
      : null,
    averageQuizScore < 60 && quizResults.length
      ? {
          id: "quiz-performance",
          level: "danger",
          title: "Performance quiz faible",
          description: `La moyenne globale des quiz est de ${averageQuizScore}%.`
        }
      : null
  ].filter(Boolean);

  return {
    cards: {
      superadmins: countsByRole.superadmin || 0,
      admins: countsByRole.admin || 0,
      teachers: countsByRole.teacher || 0,
      students: countsByRole.student || 0,
      users: users.length,
      formations: formations.length,
      classes: classes.length,
      courses: courseGroups.length,
      sessions: sessions.length,
      sections: sections.length,
      quizzes: quizzes.length,
      resources: resources.length,
      videos: videos.length,
      announcements: announcements.length,
      messages: messages.length,
      averageQuizScore,
      globalRate
    },
    attendance: {
      total: attendances.length,
      present: attendanceStatusCounts.present,
      late: attendanceStatusCounts.late,
      absent: attendanceStatusCounts.absent,
      monthly: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
    },
    progression: {
      averageQuizScore,
      completedQuizResults: quizResults.length,
      publishedResources: resources.length,
      embeddedVideos: videos.length
    },
    formationStats,
    courseStats,
    teacherStats,
    recentUsers,
    recentAnnouncements: announcements.slice(0, 6),
    recentMessages: messages.slice(0, 6),
    recentResources: resources.slice(0, 6),
    recentActivities: [
      ...announcements.slice(0, 3).map((announcement) => ({
        id: `announcement-${announcement._id}`,
        type: "Annonce",
        title: announcement.title,
        subtitle: announcement.course?.title || "Cours",
        createdAt: announcement.createdAt
      })),
      ...resources.slice(0, 3).map((resource) => ({
        id: `resource-${resource._id}`,
        type: "Support",
        title: resource.title,
        subtitle: resource.course?.title || "Cours",
        createdAt: resource.createdAt
      })),
      ...users.slice(0, 3).map((user) => ({
        id: `user-${user._id}`,
        type: "Utilisateur",
        title: `${user.firstName} ${user.lastName}`,
        subtitle: user.role,
        createdAt: user.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8),
    alerts
  };
};
