import mongoose from "mongoose";

const qrCodeSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseSession", required: true, unique: true },
    token: { type: String, required: true, unique: true },
    qrImageDataUrl: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const QrCode = mongoose.model("QrCode", qrCodeSchema);
