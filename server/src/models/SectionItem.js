import mongoose from "mongoose";

const sectionItemSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    type: { type: String, enum: ["lesson", "quiz"], required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    order: { type: Number, default: 1 },
    isRequired: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

sectionItemSchema.index({ section: 1, order: 1 });
sectionItemSchema.index({ lesson: 1 }, { unique: true, sparse: true });
sectionItemSchema.index({ quiz: 1 }, { unique: true, sparse: true });

export const SectionItem = mongoose.model("SectionItem", sectionItemSchema);
