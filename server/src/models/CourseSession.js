import mongoose from "mongoose";

const courseSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    courseGroupId: { type: String, required: true, index: true },
    courseGroupLabel: { type: String, default: "" },
    description: { type: String, default: "" },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationHours: { type: Number, required: true, min: 0.5 },
    courseType: { type: String, enum: ["presentiel", "en_ligne"], default: "presentiel" },
    room: { type: String, default: "" },
    instructor: { type: String, default: "" },
    formation: { type: mongoose.Schema.Types.ObjectId, ref: "Formation", required: true },
    qrToken: { type: String, required: true, unique: true },
    qrExpiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const CourseSession = mongoose.model("CourseSession", courseSessionSchema);
