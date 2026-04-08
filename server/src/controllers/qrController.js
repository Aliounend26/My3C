import { Attendance } from "../models/Attendance.js";
import { CourseSession } from "../models/CourseSession.js";
import { QrCode } from "../models/QrCode.js";
import QRCode from "qrcode";
import { buildQrAttendancePayload } from "../services/attendanceService.js";
import { buildQrPayload } from "../services/qrService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAttendanceWindow } from "../utils/attendance.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

export const getQrByCourse = asyncHandler(async (req, res) => {
  const qrCode = await QrCode.findOne({ course: req.params.courseId }).populate("course");

  if (!qrCode) {
    res.status(404);
    throw new Error("QR code introuvable");
  }

  const qrPayload = buildQrPayload(qrCode.course._id.toString(), qrCode.token);
  const qrImageDataUrl = await QRCode.toDataURL(qrPayload);

  res.json({
    ...qrCode.toObject(),
    qrImageDataUrl,
    qrPayload
  });
});

export const getPublicQrSession = asyncHandler(async (req, res) => {
  const { token, courseId } = req.query;

  const qrCode = await QrCode.findOne({ token, course: courseId, isActive: true }).populate({
    path: "course",
    populate: {
      path: "formation"
    }
  });

  if (!qrCode || !qrCode.course) {
    res.status(404);
    throw new Error("QR code ou seance introuvable");
  }

  const isExpired = new Date(qrCode.expiresAt) < new Date();

  res.json({
    token: qrCode.token,
    courseId: qrCode.course._id,
    expiresAt: qrCode.expiresAt,
    isActive: qrCode.isActive,
    isExpired,
    course: qrCode.course
  });
});

export const scanQrCode = asyncHandler(async (req, res) => {
  const { token, courseId } = req.body;
  const qrCode = await QrCode.findOne({ token, course: courseId, isActive: true });

  if (!qrCode) {
    res.status(400);
    throw new Error("QR code invalide");
  }

  if (new Date(qrCode.expiresAt) < new Date()) {
    res.status(400);
    throw new Error("QR code expire");
  }

  const course = await CourseSession.findById(courseId).populate("formation");

  if (!course) {
    res.status(404);
    throw new Error("Seance introuvable");
  }

  await ensureStudentCanAccessCourse(req.user, course.courseGroupId, res);

  const scannedAt = new Date();
  const { opensAt, closesAt } = getAttendanceWindow(course);
  if (scannedAt < opensAt || scannedAt > closesAt) {
    res.status(400);
    throw new Error("QR code expire ou seance hors plage de pointage");
  }

  const existing = await Attendance.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    res.status(409);
    throw new Error("Presence deja enregistree pour cette seance");
  }

  const attendance = await Attendance.create(buildQrAttendancePayload(req.user._id, course, scannedAt, qrCode._id));
  res.status(201).json(await attendance.populate("student formation course"));
});
