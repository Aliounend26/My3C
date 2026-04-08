import mongoose from "mongoose";

const videoResourceSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    embedUrl: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const VideoResource = mongoose.model("VideoResource", videoResourceSchema);
