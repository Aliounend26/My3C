import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    image: { type: String, default: "" },
    youtubeEmbedUrl: { type: String, default: "" },
    attachments: [{ type: String }],
    order: { type: Number, default: 0 },
    estimatedMinutes: { type: Number, default: 15 },
    isPublished: { type: Boolean, default: true },
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseMaterial" }],
    video: { type: mongoose.Schema.Types.ObjectId, ref: "VideoResource" },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }
  },
  { timestamps: true }
);

export const Lesson = mongoose.model("Lesson", lessonSchema);
