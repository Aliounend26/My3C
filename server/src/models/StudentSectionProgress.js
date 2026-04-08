import mongoose from "mongoose";

const studentSectionProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    itemsCompleted: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    requiredItemsCompleted: { type: Number, default: 0 },
    totalRequiredItems: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    hasSectionQuiz: { type: Boolean, default: false },
    quizCompleted: { type: Boolean, default: false },
    progressPercent: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

studentSectionProgressSchema.index({ student: 1, section: 1 }, { unique: true });

export const StudentSectionProgress = mongoose.model("StudentSectionProgress", studentSectionProgressSchema);
