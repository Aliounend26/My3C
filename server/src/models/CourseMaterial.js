import mongoose from "mongoose";

const courseMaterialSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["pdf", "document", "image", "presentation", "external", "youtube"],
      default: "document"
    },
    url: { type: String, default: "" },
    filePath: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const CourseMaterial = mongoose.model("CourseMaterial", courseMaterialSchema);
