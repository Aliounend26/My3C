import XLSX from "xlsx";
import { Attendance } from "../models/Attendance.js";
import { CourseSession } from "../models/CourseSession.js";
import { QrCode } from "../models/QrCode.js";
import { buildAttendancePayload, buildQrAttendancePayload, buildStudentAttendancePayload, getStudentAttendanceSummary } from "../services/attendanceService.js";
import { getAttendanceWindow } from "../utils/attendance.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

const parseQrPayload = (rawValue = "") => {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  try {
    const url = new URL(rawValue);
    const courseId = url.searchParams.get("courseId");
    const token = url.searchParams.get("token");

    if (!courseId || !token) {
      return null;
    }

    return { courseId, token };
  } catch {
    const courseIdMatch = rawValue.match(/courseId=([^&\s]+)/i);
    const tokenMatch = rawValue.match(/token=([^&\s]+)/i);

    if (!courseIdMatch || !tokenMatch) {
      return null;
    }

    return {
      courseId: decodeURIComponent(courseIdMatch[1]),
      token: decodeURIComponent(tokenMatch[1])
    };
  }
};

const buildAttendanceFilter = (query) => {
  const filter = {};
  if (query.student) filter.student = query.student;
  if (query.formation) filter.formation = query.formation;
  if (query.course) filter.course = query.course;
  if (query.status) filter.status = query.status;
  return filter;
};

export const getAttendances = asyncHandler(async (req, res) => {
  const filter = buildAttendanceFilter(req.query);
  const attendances = await Attendance.find(filter).populate("student formation course").sort({ scannedAt: -1 });

  res.json(req.query.date ? attendances.filter((item) => item.course?.date === req.query.date) : attendances);
});

export const exportAttendances = asyncHandler(async (req, res) => {
  const filter = buildAttendanceFilter(req.query);
  const attendances = await Attendance.find(filter).populate("student formation course").sort({ scannedAt: -1 });
  const filteredAttendances = req.query.date
    ? attendances.filter((item) => item.course?.date === req.query.date)
    : attendances;

  const rows = filteredAttendances.map((attendance) => ({
    Etudiant: `${attendance.student?.firstName || ""} ${attendance.student?.lastName || ""}`.trim(),
    Email: attendance.student?.email || "",
    Matricule: attendance.student?.matricule || "",
    Formation: attendance.formation?.name || "",
    Cours: attendance.course?.title || "",
    "Date du cours": attendance.course?.date || "",
    "Heure debut": attendance.course?.startTime || "",
    "Heure fin": attendance.course?.endTime || "",
    "Type de cours": attendance.course?.courseType === "en_ligne" ? "En ligne" : "Presentiel (Lieu 3C)",
    Lieu: attendance.course?.room || "",
    Formateur: attendance.course?.instructor || "",
    Statut: attendance.status,
    Source: attendance.source,
    "Heures comptees": attendance.presenceHours,
    Horodatage: attendance.scannedAt ? new Date(attendance.scannedAt).toLocaleString("fr-FR") : ""
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: "Aucune presence pour les filtres selectionnes" }]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Presences");

  const fileBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });

  const dateSuffix = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="presences-${dateSuffix}.xlsx"`);
  res.send(fileBuffer);
});

export const createManualAttendance = asyncHandler(async (req, res) => {
  const { studentId, courseId, status } = req.body;
  const course = await CourseSession.findById(courseId);

  if (!course) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  const attendance = await Attendance.findOneAndUpdate(
    { student: studentId, course: courseId },
    buildAttendancePayload(studentId, course, status, "manual"),
    { upsert: true, new: true, runValidators: true }
  ).populate("student formation course");

  res.status(201).json(attendance);
});

export const createStudentAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await CourseSession.findById(courseId).populate("formation");

  if (!course) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  await ensureStudentCanAccessCourse(req.user, course.courseGroupId, res);

  const currentTime = new Date();

  if (Number.isNaN(currentTime.getTime())) {
    res.status(400);
    throw new Error("Heure actuelle invalide");
  }

  const { opensAt, closesAt } = getAttendanceWindow(course);

  if (currentTime < opensAt) {
    res.status(400);
    throw new Error("La declaration de presence est disponible 30 minutes avant le debut du cours");
  }

  if (currentTime > closesAt) {
    res.status(400);
    throw new Error("La declaration de presence est fermee. Elle reste disponible jusqu'a 1 heure apres la fin du cours");
  }

  const attendance = await Attendance.findOneAndUpdate(
    { student: req.user._id, course: courseId },
    buildStudentAttendancePayload(req.user._id, course, currentTime),
    { upsert: true, new: true, runValidators: true }
  ).populate("student formation course");

  res.status(201).json(attendance);
});

export const scanAttendance = asyncHandler(async (req, res) => {
  const parsedPayload = parseQrPayload(req.body.rawValue || req.body.code || "");
  const courseId = req.body.courseId || parsedPayload?.courseId;
  const token = req.body.token || parsedPayload?.token;

  if (!courseId || !token) {
    res.status(400);
    throw new Error("QR code invalide");
  }

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
    throw new Error("Cours introuvable");
  }

  await ensureStudentCanAccessCourse(req.user, course.courseGroupId, res);

  const existing = await Attendance.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    res.status(409);
    throw new Error("Presence deja enregistree");
  }

  const scannedAt = new Date();
  const { opensAt, closesAt } = getAttendanceWindow(course);

  if (scannedAt < opensAt || scannedAt > closesAt) {
    res.status(400);
    throw new Error("QR code expire ou seance hors plage de pointage");
  }

  const attendance = await Attendance.create(buildQrAttendancePayload(req.user._id, course, scannedAt, qrCode._id));
  res.status(201).json(await attendance.populate("student formation course qrCode"));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const existing = await Attendance.findById(req.params.id).populate("course");

  if (!existing) {
    res.status(404);
    throw new Error("Presence introuvable");
  }

  const updated = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      presenceHours: buildAttendancePayload(existing.student, existing.course, req.body.status ?? existing.status).presenceHours
    },
    { new: true, runValidators: true }
  ).populate("student formation course");

  res.json(updated);
});

export const getStudentSummary = asyncHandler(async (req, res) => {
  if (req.user.role === "student" && req.params.studentId && req.params.studentId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez consulter que vos propres presences");
  }

  res.json(await getStudentAttendanceSummary(req.params.studentId || req.user._id));
});

export const getMyAttendanceForCourse = asyncHandler(async (req, res) => {
  const course = await CourseSession.findById(req.params.courseId).populate("formation");

  if (!course) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  await ensureStudentCanAccessCourse(req.user, course.courseGroupId, res);

  const attendance = await Attendance.findOne({ student: req.user._id, course: course._id }).populate("course formation qrCode");

  res.json({
    course,
    attendance,
    rate: attendance?.course?.durationHours ? Number(((attendance.presenceHours / attendance.course.durationHours) * 100).toFixed(1)) : 0
  });
});
