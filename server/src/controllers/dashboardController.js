import { Announcement } from "../models/Announcement.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { CourseMaterial } from "../models/CourseMaterial.js";
import { CourseSession } from "../models/CourseSession.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { Quiz } from "../models/Quiz.js";
import { QuizResult } from "../models/QuizResult.js";
import { Section } from "../models/Section.js";
import { VideoResource } from "../models/VideoResource.js";
import { getStudentAttendanceSummary } from "../services/attendanceService.js";
import { getAdminDashboardData, getSuperAdminDashboardData, getTeacherDashboardData } from "../services/dashboardService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStudentAllowedCourseIds } from "../utils/studentAccess.js";

const average = (values) => {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
};

export const getAdminDashboard = asyncHandler(async (req, res) => {
  res.json(await getAdminDashboardData());
});

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  res.json(await getTeacherDashboardData(req.user._id));
});

export const getSuperAdminDashboard = asyncHandler(async (req, res) => {
  res.json(await getSuperAdminDashboardData());
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const summary = await getStudentAttendanceSummary(req.user._id);
  const courseIds = await getStudentAllowedCourseIds(req.user);
  const today = new Date().toISOString().slice(0, 10);

  const [courses, upcomingCourses, sections, resources, quizzes, quizResults, announcements, messages, videos, notifications] = await Promise.all([
    CourseGroup.find({ _id: { $in: courseIds } }).populate("formation teacher classRoom").sort({ createdAt: -1 }),
    CourseSession.find({
      courseGroupId: { $in: courseIds },
      date: { $gte: today }
    })
      .sort({ date: 1, startTime: 1 })
      .limit(6)
      .populate("formation"),
    Section.find({ course: { $in: courseIds } }).populate("course").sort({ createdAt: -1 }),
    CourseMaterial.find({ course: { $in: courseIds } }).populate("course section lesson createdBy").sort({ createdAt: -1 }),
    Quiz.find({ course: { $in: courseIds }, published: true }).populate("course section lesson questions").sort({ createdAt: -1 }),
    QuizResult.find({ student: req.user._id }).populate("quiz").sort({ completedAt: -1 }),
    Announcement.find({ course: { $in: courseIds } }).populate("course author").sort({ pinned: -1, createdAt: -1 }),
    Message.find({ $or: [{ from: req.user._id }, { to: req.user._id }] }).populate("from to course").sort({ createdAt: -1 }),
    VideoResource.find({ course: { $in: courseIds } }).sort({ createdAt: -1 }),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5)
  ]);

  const latestAttendances = summary.attendances.slice(0, 5);
  const completedQuizIds = new Set(quizResults.map((result) => result.quiz?._id?.toString()).filter(Boolean));
  const pendingQuizzes = quizzes.filter((quiz) => !completedQuizIds.has(quiz._id.toString()));
  const averageQuizScore = average(
    quizResults
      .filter((result) => result.maxScore)
      .map((result) => (result.score / result.maxScore) * 100)
  );

  const courseCards = courses.map((course) => {
    const courseId = course._id.toString();
    const courseSections = sections.filter((section) => section.course?._id?.toString() === courseId || section.course?.toString?.() === courseId);
    const courseResources = resources.filter((resource) => resource.course?._id?.toString() === courseId || resource.course?.toString?.() === courseId);
    const courseQuizzes = quizzes.filter((quiz) => quiz.course?._id?.toString() === courseId || quiz.course?.toString?.() === courseId);
    const courseResults = quizResults.filter((result) => result.quiz?.course?.toString?.() === courseId || result.quiz?.course?._id?.toString?.() === courseId);
    const resourceProgress = courseResources.length ? Math.min(100, Math.round((courseResources.length / Math.max(courseResources.length, 1)) * 35)) : 10;
    const videoProgress = videos.filter((video) => video.course?.toString() === courseId).length ? 25 : 0;
    const quizProgress = courseQuizzes.length ? Math.round((courseResults.length / courseQuizzes.length) * 40) : 0;
    const sectionProgress = courseSections.length ? Math.min(courseSections.length * 8, 25) : 0;

    return {
      ...course.toObject(),
      sectionCount: courseSections.length,
      resourceCount: courseResources.length,
      quizCount: courseQuizzes.length,
      completedQuizCount: courseResults.length,
      progress: Math.min(100, resourceProgress + videoProgress + quizProgress + sectionProgress)
    };
  });

  res.json({
    student: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      avatar: req.user.avatar,
      formations: req.user.formations
    },
    summary,
    quickStats: {
      activeCourses: courses.length,
      pendingQuizzes: pendingQuizzes.length,
      averageQuizScore,
      unreadMessages: messages.filter((message) => message.to?._id?.toString() === req.user._id.toString() && !message.isRead).length,
      unreadNotifications: notifications.filter((notification) => !notification.isRead).length
    },
    courseCards,
    upcomingCourses,
    latestAttendances,
    recentSections: sections.slice(0, 5),
    latestResources: resources.slice(0, 5),
    pendingQuizzes: pendingQuizzes.slice(0, 6),
    recentAnnouncements: announcements.slice(0, 5),
    recentMessages: messages.slice(0, 5),
    recentNotifications: notifications,
    latestQuizResults: quizResults.slice(0, 5),
    globalProgress: average(courseCards.map((course) => course.progress))
  });
});
