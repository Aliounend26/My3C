import mongoose from "mongoose";

const studentProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "completed" },
    completedAt: { type: Date },
    progressPercent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

studentProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

export const StudentProgress = mongoose.model("StudentProgress", studentProgressSchema);
