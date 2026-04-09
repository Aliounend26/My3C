import { Quiz } from "../models/Quiz.js";
import { QuizResult } from "../models/QuizResult.js";
import { Section } from "../models/Section.js";
import { SectionItem } from "../models/SectionItem.js";
import { StudentCourseProgress } from "../models/StudentCourseProgress.js";
import { StudentProgress } from "../models/StudentProgress.js";
import { StudentSectionProgress } from "../models/StudentSectionProgress.js";
import { createNotification } from "./notificationHelper.js";

export const syncSectionProgress = async (studentId, lesson) => {
  const sectionId = lesson.section?._id || lesson.section;
  if (!sectionId) return null;

  const section = await Section.findById(sectionId);
  if (!section) return null;

  const courseId = lesson.course?._id || lesson.course;
  const courseTitle = typeof lesson.course === "object" ? lesson.course.title : "votre cours";

  const items = await SectionItem.find({ section: sectionId, course: courseId, isPublished: true }).sort({ order: 1, createdAt: 1 });
  const lessonItemIds = items.filter((item) => item.type === "lesson" && item.lesson).map((item) => item.lesson);
  const quizItemIds = items.filter((item) => item.type === "quiz" && item.quiz).map((item) => item.quiz);

  const [completedLessonsDocs, quizzes] = await Promise.all([
    StudentProgress.find({
      student: studentId,
      section: sectionId,
      course: courseId,
      status: "completed",
      lesson: { $in: lessonItemIds }
    }).select("lesson"),
    Quiz.find({ _id: { $in: quizItemIds } }).select("_id requirePassingScoreToCompleteSection")
  ]);

  const completedLessonSet = new Set(completedLessonsDocs.map((doc) => doc.lesson.toString()));
  const quizMap = new Map(quizzes.map((quiz) => [quiz._id.toString(), quiz]));

  const quizResults = await QuizResult.find({
    student: studentId,
    quiz: { $in: quizItemIds }
  }).select("quiz passed");

  const quizResultMap = new Map();
  quizResults.forEach((result) => {
    const key = result.quiz.toString();
    if (!quizResultMap.has(key)) {
      quizResultMap.set(key, []);
    }
    quizResultMap.get(key).push(result);
  });

  const completedItems = items.filter((item) => {
    if (item.type === "lesson") {
      return completedLessonSet.has(item.lesson?.toString());
    }

    const quiz = quizMap.get(item.quiz?.toString());
    const results = quizResultMap.get(item.quiz?.toString()) || [];
    if (!quiz) return false;

    return quiz.requirePassingScoreToCompleteSection
      ? results.some((result) => result.passed)
      : results.length > 0;
  });

  const requiredItems = items.filter((item) => item.isRequired);
  const requiredCompletedItems = completedItems.filter((item) => item.isRequired);
  const totalLessons = items.filter((item) => item.type === "lesson").length;
  const lessonsCompleted = completedItems.filter((item) => item.type === "lesson").length;
  const hasSectionQuiz = items.some((item) => item.type === "quiz");
  const quizCompleted = items
    .filter((item) => item.type === "quiz")
    .every((item) => completedItems.some((completedItem) => completedItem._id.toString() === item._id.toString()));
  const isCompleted = requiredItems.length
    ? requiredCompletedItems.length === requiredItems.length
    : completedItems.length === items.length;
  const progressPercent = items.length ? Math.round((completedItems.length / items.length) * 100) : 0;

  const existingProgress = await StudentSectionProgress.findOne({ student: studentId, section: sectionId });

  const sectionProgress = await StudentSectionProgress.findOneAndUpdate(
    { student: studentId, course: courseId, section: sectionId },
    {
      student: studentId,
      course: courseId,
      section: sectionId,
      itemsCompleted: completedItems.length,
      totalItems: items.length,
      requiredItemsCompleted: requiredCompletedItems.length,
      totalRequiredItems: requiredItems.length,
      lessonsCompleted,
      totalLessons,
      hasSectionQuiz,
      quizCompleted,
      progressPercent,
      isCompleted,
      completedAt: isCompleted ? existingProgress?.completedAt || new Date() : undefined
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (isCompleted && !existingProgress?.isCompleted) {
    await createNotification(
      {
        userId: studentId,
        role: "student",
        type: "chapter_completed",
        priority: "medium",
        title: `Chapitre "${section.title}" termine`,
        message: `Vous avez complete la section "${section.title}" du cours "${courseTitle}". Continuez votre progression !`,
        link: `/sections/${sectionId}`,
        metadata: { sectionId: sectionId.toString(), courseId: courseId?.toString?.() || courseId }
      }
    );
  }

  return sectionProgress;
};

export const syncCourseProgress = async (studentId, courseId, courseTitle = "votre cours") => {
  const totalSections = await Section.countDocuments({ course: courseId, isPublished: true });
  const completedSections = await StudentSectionProgress.countDocuments({
    student: studentId,
    course: courseId,
    isCompleted: true
  });
  const progressPercent = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;

  const existingProgress = await StudentCourseProgress.findOne({ student: studentId, course: courseId });
  const courseProgress = await StudentCourseProgress.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      student: studentId,
      course: courseId,
      progressPercent,
      completedSections,
      totalSections
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (progressPercent === 100 && (!existingProgress || existingProgress.progressPercent < 100)) {
    await createNotification(
      {
        userId: studentId,
        role: "student",
        type: "course_completed",
        priority: "high",
        title: `Cours "${courseTitle}" termine`,
        message: `Felicitations ! Vous avez termine tous les chapitres du cours "${courseTitle}". Continuez sur un nouveau parcours.`,
        link: `/courses/${courseId?.toString?.() || courseId}`,
        metadata: { courseId: courseId?.toString?.() || courseId }
      }
    );
  }

  return courseProgress;
};
