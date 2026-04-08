import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Section = mongoose.model("Section", sectionSchema);
