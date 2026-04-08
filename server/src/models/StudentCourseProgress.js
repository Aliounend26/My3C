import mongoose from "mongoose";

const studentCourseProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    progressPercent: { type: Number, default: 0 },
    completedSections: { type: Number, default: 0 },
    totalSections: { type: Number, default: 0 }
  },
  { timestamps: true }
);

studentCourseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export const StudentCourseProgress = mongoose.model("StudentCourseProgress", studentCourseProgressSchema);
