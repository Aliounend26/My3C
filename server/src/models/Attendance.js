import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseSession", required: true },
    formation: { type: mongoose.Schema.Types.ObjectId, ref: "Formation", required: true },
    qrCode: { type: mongoose.Schema.Types.ObjectId, ref: "QrCode", default: null },
    status: { type: String, enum: ["present", "absent", "late"], default: "present" },
    source: { type: String, enum: ["qr", "manual", "student"], default: "qr" },
    scannedAt: { type: Date, default: Date.now },
    presenceHours: { type: Number, default: 0 }
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, course: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
