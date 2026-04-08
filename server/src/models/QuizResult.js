import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" },
        selected: [{ type: String }],
        correct: { type: Boolean, default: false }
      }
    ],
    attemptNumber: { type: Number, default: 1 },
    passed: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

quizResultSchema.index({ quiz: 1, student: 1, attemptNumber: 1 }, { unique: true });

export const QuizResult = mongoose.model("QuizResult", quizResultSchema);
