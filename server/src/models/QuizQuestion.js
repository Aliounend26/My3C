import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ["single", "multiple", "true_false"], default: "single" },
    image: { type: String, default: "" },
    explanation: { type: String, default: "" },
    options: [
      {
        text: { type: String, required: true },
        image: { type: String, default: "" },
        isCorrect: { type: Boolean, default: false }
      }
    ],
    order: { type: Number, default: 0 },
    score: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const QuizQuestion = mongoose.model("QuizQuestion", quizQuestionSchema);
