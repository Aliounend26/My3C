import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, default: 20 },
    maxScore: { type: Number, default: 100 },
    maxAttempts: { type: Number, default: 1, min: 1 },
    passingScore: { type: Number, default: 0, min: 0 },
    isRequired: { type: Boolean, default: false },
    countsTowardProgress: { type: Boolean, default: true },
    requirePassingScoreToCompleteSection: { type: Boolean, default: false },
    showScoreAfterSubmission: { type: Boolean, default: true },
    showAnswersAfterSubmission: { type: Boolean, default: true },
    allowMultipleAttempts: { type: Boolean, default: false },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" }],
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);
