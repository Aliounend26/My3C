import crypto from "crypto";
import QRCode from "qrcode";
import { QrCode } from "../models/QrCode.js";

const getPublicAppUrl = () => {
  const configuredClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return configuredClientUrl.split(",")[0].trim().replace(/\/$/, "");
};

export const buildQrPayload = (courseId, token) => {
  const publicUrl = new URL("/qr-attendance", getPublicAppUrl());
  publicUrl.searchParams.set("courseId", courseId);
  publicUrl.searchParams.set("token", token);
  return publicUrl.toString();
};

export const generateCourseQr = async (course) => {
  const token = crypto.randomBytes(16).toString("hex");
  const qrPayload = buildQrPayload(course._id.toString(), token);
  const qrImageDataUrl = await QRCode.toDataURL(qrPayload);

  return QrCode.findOneAndUpdate(
    { course: course._id },
    {
      course: course._id,
      token,
      qrImageDataUrl,
      expiresAt: course.qrExpiresAt,
      isActive: true
    },
    { upsert: true, new: true }
  );
};
