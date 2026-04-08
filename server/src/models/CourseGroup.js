import mongoose from "mongoose";

const courseGroupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    sessionMode: { type: String, enum: ["single", "multiple"], default: "single" },
    courseType: { type: String, enum: ["presentiel", "en_ligne"], default: "presentiel" },
    instructor: { type: String, default: "" },
    formation: { type: mongoose.Schema.Types.ObjectId, ref: "Formation", required: true },
    classRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const CourseGroup = mongoose.model("CourseGroup", courseGroupSchema);
