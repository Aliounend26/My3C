import { CourseGroup } from "../models/CourseGroup.js";
import { Section } from "../models/Section.js";
import { Quiz } from "../models/Quiz.js";
import { QuizQuestion } from "../models/QuizQuestion.js";
import { QuizResult } from "../models/QuizResult.js";
import { SectionItem } from "../models/SectionItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildStudentCourseFilter, ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { ensureTeacherOwnsCourse, getTeacherOwnedCourseIds } from "../utils/teacherAccess.js";
import { syncCourseProgress, syncSectionProgress } from "../utils/progressHelpers.js";
import { createNotifications, getCourseAudience } from "../utils/notificationHelper.js";

const normalizeQuizPayload = (payload) => {
  const normalized = {
    ...payload,
    maxAttempts: payload.allowMultipleAttempts ? Math.max(Number(payload.maxAttempts || 1), 1) : 1,
    passingScore: Number(payload.passingScore || 0),
    durationMinutes: Number(payload.durationMinutes || 0),
    maxScore: Number(payload.maxScore || 0),
    isRequired: Boolean(payload.isRequired),
    countsTowardProgress: payload.countsTowardProgress !== undefined ? Boolean(payload.countsTowardProgress) : true,
    requirePassingScoreToCompleteSection: Boolean(payload.requirePassingScoreToCompleteSection),
    showScoreAfterSubmission: payload.showScoreAfterSubmission !== undefined ? Boolean(payload.showScoreAfterSubmission) : true,
    showAnswersAfterSubmission: payload.showAnswersAfterSubmission !== undefined ? Boolean(payload.showAnswersAfterSubmission) : true,
    allowMultipleAttempts: Boolean(payload.allowMultipleAttempts),
    published: Boolean(payload.published)
  };

  if (!normalized.allowMultipleAttempts) {
    normalized.maxAttempts = 1;
  }

  return normalized;
};

const validateQuestions = (questions, res) => {
  if (!Array.isArray(questions) || !questions.length) {
    res.status(400);
    throw new Error("Le quiz doit contenir au moins une question");
  }

  questions.forEach((question, index) => {
    if (!question.text?.trim()) {
      res.status(400);
      throw new Error(`La question ${index + 1} doit contenir un enonce`);
    }

    if (!Array.isArray(question.options) || !question.options.length) {
      res.status(400);
      throw new Error(`La question ${index + 1} doit contenir au moins une reponse`);
    }

    const correctCount = question.options.filter((option) => option.isCorrect).length;
    if (correctCount === 0) {
      res.status(400);
      throw new Error(`La question ${index + 1} doit avoir au moins une bonne reponse`);
    }

    if (question.type === "single" || question.type === "true_false") {
      if (correctCount !== 1) {
        res.status(400);
        throw new Error(`La question ${index + 1} doit avoir une seule bonne reponse`);
      }
    }
  });
};

const sanitizeQuizForStudent = (quiz) => {
  const quizObject = typeof quiz.toObject === "function" ? quiz.toObject() : quiz;
  return {
    ...quizObject,
    questions: (quizObject.questions || []).map((question) => ({
      ...question,
      options: (question.options || []).map((option) => ({
        text: option.text
      }))
    }))
  };
};

export const getQuizzes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;
  if (req.query.lesson) filter.lesson = req.query.lesson;
  if (req.query.section) filter.section = req.query.section;

  if (req.user.role === "student") {
    if (req.query.course) {
      await ensureStudentCanAccessCourse(req.user, req.query.course, res);
    } else {
      const studentCourseFilter = await buildStudentCourseFilter(req.user);
      const accessibleCourses = await CourseGroup.find(studentCourseFilter).select("_id");
      filter.course = { $in: accessibleCourses.map((course) => course._id.toString()) };
    }

    filter.published = true;
  }

  if (req.user.role === "teacher") {
    const ownedCourseIds = await getTeacherOwnedCourseIds(req.user._id);

    if (req.query.course) {
      await ensureTeacherOwnsCourse(req.user._id, req.query.course, res, "Vous ne pouvez pas consulter les quiz de ce cours");
      filter.course = req.query.course;
    } else {
      filter.course = { $in: ownedCourseIds };
    }
  }

  const quizzes = await Quiz.find(filter).populate("course lesson section questions").sort({ createdAt: -1 });
  res.json(req.user.role === "student" ? quizzes.map(sanitizeQuizForStudent) : quizzes);
});

export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate("course lesson section questions");
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz introuvable");
  }

  if (req.user.role === "student") {
    await ensureStudentCanAccessCourse(req.user, quiz.course, res);

    if (!quiz.published) {
      res.status(403);
      throw new Error("Quiz indisponible");
    }
  }

  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, quiz.course, res, "Vous ne pouvez pas consulter ce quiz");
  }

  res.json(req.user.role === "student" ? sanitizeQuizForStudent(quiz) : quiz);
});

export const createQuiz = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, req.body.course, res, "Vous ne pouvez pas modifier ce quiz pour ce cours");
  }
  const { questions = [], ...quizPayload } = req.body;
  validateQuestions(questions, res);
  const quiz = await Quiz.create(normalizeQuizPayload(quizPayload));
  const createdQuestions = await QuizQuestion.insertMany(questions.map((question) => ({ ...question, quiz: quiz._id })));
  quiz.questions = createdQuestions.map((question) => question._id);
  await quiz.save();
  if (quiz.section) {
    await SectionItem.findOneAndUpdate(
      { quiz: quiz._id },
      {
        course: quiz.course,
        section: quiz.section,
        type: "quiz",
        quiz: quiz._id,
        order: Number(req.body.order || 1),
        isRequired: quiz.isRequired,
        isPublished: quiz.published
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  if (quiz.published) {
    const { course, students, admins, superadmins } = await getCourseAudience(quiz.course);
    await createNotifications([
      ...students.map((student) => ({
        userId: student._id,
        role: student.role,
        type: "quiz_available",
        priority: "high",
        title: "Nouveau quiz disponible",
        message: `Le quiz "${quiz.title}" est maintenant disponible dans ${course?.title || "votre cours"}.`,
        link: `/quizzes/${quiz._id}`,
        metadata: { quizId: quiz._id.toString(), courseId: quiz.course?.toString?.() || quiz.course }
      })),
      {
        userId: req.user._id,
        role: req.user.role,
        type: "quiz_published",
        priority: "low",
        title: "Quiz publie",
        message: `Le quiz "${quiz.title}" a ete publie avec succes.`,
        link: "/quizzes",
        metadata: { quizId: quiz._id.toString(), courseId: quiz.course?.toString?.() || quiz.course }
      },
      ...admins.map((admin) => ({
        userId: admin._id,
        role: admin.role,
        type: "quiz_published",
        priority: "low",
        title: "Quiz publie",
        message: `${req.user.firstName} ${req.user.lastName} a publie le quiz "${quiz.title}".`,
        link: "/courses",
        metadata: { quizId: quiz._id.toString(), courseId: quiz.course?.toString?.() || quiz.course }
      })),
      ...superadmins.map((superadmin) => ({
        userId: superadmin._id,
        role: superadmin.role,
        type: "activity_important",
        priority: "low",
        title: "Quiz publie",
        message: `Un nouveau quiz a ete publie dans ${course?.title || "un cours"}.`,
        link: "/content",
        metadata: { quizId: quiz._id.toString(), courseId: quiz.course?.toString?.() || quiz.course }
      }))
    ]);
  }
  res.status(201).json(await Quiz.findById(quiz._id).populate("course lesson section questions"));
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const existing = await Quiz.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Quiz introuvable");
  }
  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, req.body.course || existing.course, res, "Vous ne pouvez pas modifier ce quiz pour ce cours");
  }
  const { questions, ...quizPayload } = req.body;
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, normalizeQuizPayload(quizPayload), { new: true, runValidators: true });
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz introuvable");
  }

  if (Array.isArray(questions)) {
    validateQuestions(questions, res);
    await QuizQuestion.deleteMany({ quiz: quiz._id });
    const updatedQuestions = await QuizQuestion.insertMany(questions.map((question) => ({ ...question, quiz: quiz._id })));
    quiz.questions = updatedQuestions.map((question) => question._id);
    await quiz.save();
  }
  if (quiz.section) {
    await SectionItem.findOneAndUpdate(
      { quiz: quiz._id },
      {
        course: quiz.course,
        section: quiz.section,
        type: "quiz",
        quiz: quiz._id,
        order: Number(req.body.order || 1),
        isRequired: quiz.isRequired,
        isPublished: quiz.published
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  if (quiz.published) {
    const wasPublished = existing.published !== false;
    const { course, students } = await getCourseAudience(quiz.course);
    await createNotifications([
      ...students.map((student) => ({
        userId: student._id,
        role: student.role,
        type: wasPublished ? "content_updated" : "quiz_available",
        priority: "medium",
        title: wasPublished ? "Quiz mis a jour" : "Nouveau quiz disponible",
        message: wasPublished
          ? `Le quiz "${quiz.title}" a ete mis a jour dans ${course?.title || "votre cours"}.`
          : `Le quiz "${quiz.title}" est maintenant disponible dans ${course?.title || "votre cours"}.`,
        link: `/quizzes/${quiz._id}`,
        metadata: { quizId: quiz._id.toString(), courseId: quiz.course?.toString?.() || quiz.course }
      })),
      {
        userId: req.user._id,
        role: req.user.role,
        type: "quiz_published",
        priority: "low",
        title: "Quiz mis a jour",
        message: `Les modifications du quiz "${quiz.title}" ont ete enregistrees.`,
        link: "/quizzes",
        metadata: { quizId: quiz._id.toString(), courseId: quiz.course?.toString?.() || quiz.course }
      }
    ]);
  }

  res.json(await Quiz.findById(quiz._id).populate("course lesson section questions"));
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const existing = await Quiz.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Quiz introuvable");
  }
  if (req.user.role === "teacher") {
    await ensureTeacherOwnsCourse(req.user._id, existing.course, res, "Vous ne pouvez pas supprimer ce quiz");
  }
  await SectionItem.deleteOne({ quiz: req.params.id });
  await Quiz.findByIdAndDelete(req.params.id);
  await QuizQuestion.deleteMany({ quiz: req.params.id });
  await QuizResult.deleteMany({ quiz: req.params.id });
  res.json({ success: true });
});

export const submitQuiz = asyncHandler(async (req, res) => {
  const { answers = [] } = req.body;
  const quiz = await Quiz.findById(req.params.id).populate("questions lesson section course");
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz introuvable");
  }

  await ensureStudentCanAccessCourse(req.user, quiz.course, res);

  if (!quiz.published) {
    res.status(403);
    throw new Error("Quiz indisponible");
  }

  const attemptCount = await QuizResult.countDocuments({ quiz: quiz._id, student: req.user._id });
  if (attemptCount >= quiz.maxAttempts) {
    res.status(400);
    throw new Error("Nombre maximum de tentatives atteint pour ce quiz");
  }

  let score = 0;
  const answerRecords = quiz.questions.map((question) => {
    const provided = answers.find((item) => item.question === question._id.toString());
    const selected = provided?.selected ?? [];
    const correct = question.options.every((option) => {
      const isSelected = selected.includes(option.text);
      return option.isCorrect === isSelected;
    });
    if (correct) score += question.score;
    return {
      question: question._id,
      selected,
      correct
    };
  });

  const scoreRate = quiz.maxScore ? (score / quiz.maxScore) * 100 : 0;
  const passed = scoreRate >= Number(quiz.passingScore || 0);

  const result = await QuizResult.findOneAndUpdate(
    { quiz: quiz._id, student: req.user._id, attemptNumber: attemptCount + 1 },
    {
      quiz: quiz._id,
      student: req.user._id,
      score,
      maxScore: quiz.maxScore,
      answers: answerRecords,
      attemptNumber: attemptCount + 1,
      passed,
      completedAt: new Date()
    },
    { upsert: true, new: true }
  ).populate("quiz student answers.question");

  const sectionProgress = quiz.countsTowardProgress
    ? await syncSectionProgress(req.user._id, {
        section: quiz.section || quiz.lesson?.section,
        course: quiz.course
      })
    : null;
  const courseProgress = quiz.countsTowardProgress ? await syncCourseProgress(req.user._id, quiz.course, quiz.course?.title || "votre cours") : null;

  const response = result.toObject();
  response.sectionProgress = sectionProgress;
  response.courseProgress = courseProgress;
  response.remainingAttempts = Math.max(quiz.maxAttempts - (attemptCount + 1), 0);
  response.showScoreAfterSubmission = quiz.showScoreAfterSubmission;
  response.showAnswersAfterSubmission = quiz.showAnswersAfterSubmission;
  if (!quiz.showAnswersAfterSubmission) {
    response.answers = [];
  }
  if (!quiz.showScoreAfterSubmission) {
    response.score = null;
    response.maxScore = quiz.maxScore;
  }

  const { teacher } = await getCourseAudience(quiz.course?._id || quiz.course);
  await createNotifications([
    {
      userId: req.user._id,
      role: req.user.role,
      type: "quiz_result",
      priority: passed ? "medium" : "high",
      title: passed ? "Quiz reussi" : "Resultat du quiz disponible",
      message: `Vous avez obtenu ${Math.round(scoreRate)}% au quiz "${quiz.title}".`,
      link: "/quiz-results",
      metadata: {
        quizId: quiz._id.toString(),
        score,
        maxScore: quiz.maxScore,
        scoreRate: Math.round(scoreRate),
        passed
      }
    },
    teacher
      ? {
          userId: teacher._id,
          role: teacher.role,
          type: "quiz_submitted",
          priority: "medium",
          title: "Quiz soumis par un etudiant",
          message: `${req.user.firstName} ${req.user.lastName} a soumis le quiz "${quiz.title}" avec ${Math.round(scoreRate)}%.`,
          link: "/quizzes",
          metadata: {
            quizId: quiz._id.toString(),
            studentId: req.user._id.toString(),
            scoreRate: Math.round(scoreRate),
            passed
          }
        }
      : null
  ]);

  res.json(response);
});

export const getQuizResults = asyncHandler(async (req, res) => {
  const quizId = req.query.quiz;
  const filter = {};
  if (quizId) filter.quiz = quizId;

  if (req.user.role === "student") {
    filter.student = req.user._id;
  }

  if (req.user.role === "teacher") {
    const ownedCourseIds = await getTeacherOwnedCourseIds(req.user._id);
    const ownedQuizzes = await Quiz.find({ course: { $in: ownedCourseIds } }).select("_id");
    filter.quiz = quizId ? quizId : { $in: ownedQuizzes.map((quiz) => quiz._id.toString()) };

    if (quizId) {
      const quiz = await Quiz.findById(quizId).select("course");
      if (!quiz) {
        res.status(404);
        throw new Error("Quiz introuvable");
      }
      await ensureTeacherOwnsCourse(req.user._id, quiz.course, res, "Vous ne pouvez pas consulter les resultats de ce quiz");
    }
  }

  const results = await QuizResult.find(filter).populate("quiz student answers.question").sort({ completedAt: -1 });
  res.json(results);
});
