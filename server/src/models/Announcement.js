import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup" },
    classRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
