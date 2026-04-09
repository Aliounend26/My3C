import XLSX from "xlsx";
import { User } from "../models/User.js";
import { ClassRoom } from "../models/ClassRoom.js";
import { Attendance } from "../models/Attendance.js";
import { StudentCourseProgress } from "../models/StudentCourseProgress.js";
import { QuizResult } from "../models/QuizResult.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateAttendanceRate } from "../utils/attendance.js";
import { getTeacherOwnedCourseIds } from "../utils/teacherAccess.js";

const buildAdminStudentFilter = (query = {}) => {
  const filter = { role: "student" };

  if (query.formation) {
    filter.formations = query.formation;
  }

  if (query.course) {
    filter.assignedCourses = query.course;
  }

  if (query.student) {
    filter._id = query.student;
  }

  if (query.status === "active") {
    filter.isActive = true;
  }

  if (query.status === "inactive") {
    filter.isActive = false;
  }

  return filter;
};

const buildTeacherStudentContext = async (teacherId) => {
  const courseIds = await getTeacherOwnedCourseIds(teacherId);
  const teacherCourses = await CourseGroup.find({ _id: { $in: courseIds } }).select("classRoom");
  const classIds = [...new Set(teacherCourses.map((course) => course.classRoom?.toString()).filter(Boolean))];
  const relevantClasses = await ClassRoom.find({ _id: { $in: classIds } }).populate("formation").select("name code formation students");

  return {
    courseIds,
    classIds,
    classes: relevantClasses
  };
};

const getTeacherScopedStudents = async (teacherId, query = {}) => {
  const { courseIds, classIds, classes } = await buildTeacherStudentContext(teacherId);

  if (!courseIds.length && !classIds.length) {
    return {
      courseIds,
      classIds,
      classes,
      students: []
    };
  }

  const studentFilter = {
    role: "student",
    $or: [{ assignedCourses: { $in: courseIds } }, { classrooms: { $in: classIds } }]
  };

  if (query.courseId) {
    studentFilter.assignedCourses = query.courseId;
  }

  if (query.classId) {
    studentFilter.classrooms = query.classId;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");
    studentFilter.$and = [
      {
        $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }]
      }
    ];
  }

  if (query.email) {
    studentFilter.email = new RegExp(query.email, "i");
  }

  const students = await User.find(studentFilter)
    .select("-password")
    .populate("formations classrooms assignedCourses")
    .sort({ firstName: 1, lastName: 1 });

  const studentIds = students.map((student) => student._id);
  const progressDocs = await StudentCourseProgress.find({
    student: { $in: studentIds },
    course: { $in: courseIds }
  });
  const attendances = await Attendance.find({ student: { $in: studentIds } }).populate("course formation");
  const quizResults = await QuizResult.find({ student: { $in: studentIds } }).populate("quiz");

  const progressByStudent = new Map();
  progressDocs.forEach((doc) => {
    const key = doc.student.toString();
    const current = progressByStudent.get(key) || [];
    current.push(doc);
    progressByStudent.set(key, current);
  });

  const attendanceByStudent = new Map();
  attendances.forEach((attendance) => {
    if (!courseIds.includes(attendance.course?.courseGroupId?.toString?.() || attendance.course?.courseGroupId)) {
      return;
    }
    const key = attendance.student.toString();
    const current = attendanceByStudent.get(key) || [];
    current.push(attendance);
    attendanceByStudent.set(key, current);
  });

  const quizByStudent = new Map();
  quizResults.forEach((result) => {
    const quizCourseId = result.quiz?.course?._id?.toString?.() || result.quiz?.course?.toString?.();
    if (!courseIds.includes(quizCourseId)) {
      return;
    }
    const key = result.student.toString();
    const current = quizByStudent.get(key) || [];
    current.push(result);
    quizByStudent.set(key, current);
  });

  const items = students.map((student) => {
    const teacherCourses = (student.assignedCourses || []).filter((course) => courseIds.includes((course._id || course).toString()));
    const teacherClasses = (student.classrooms || []).filter((classRoom) => classIds.includes((classRoom._id || classRoom).toString()));
    const studentProgress = progressByStudent.get(student._id.toString()) || [];
    const studentAttendances = attendanceByStudent.get(student._id.toString()) || [];
    const studentQuizResults = quizByStudent.get(student._id.toString()) || [];
    const avgProgress = studentProgress.length
      ? Number((studentProgress.reduce((sum, item) => sum + (item.progressPercent || 0), 0) / studentProgress.length).toFixed(1))
      : 0;
    const attendancePresentHours = studentAttendances.reduce((sum, item) => sum + (item.presenceHours || 0), 0);
    const attendanceTotalHours = studentAttendances.reduce((sum, item) => sum + (item.course?.durationHours || 0), 0);
    const attendanceRate = calculateAttendanceRate(attendancePresentHours, attendanceTotalHours);
    const averageQuizScore = studentQuizResults.length
      ? Number(
          (
            studentQuizResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) /
            studentQuizResults.length
          ).toFixed(1)
        )
      : 0;

    return {
      ...student.toObject(),
      teacherCourses,
      teacherClasses,
      progressRate: avgProgress,
      attendanceRate,
      attendanceCount: studentAttendances.length,
      averageQuizScore,
      quizResultsCount: studentQuizResults.length,
      latestQuizResults: studentQuizResults.slice(0, 5),
      latestAttendances: studentAttendances.slice(0, 5)
    };
  });

  return {
    courseIds,
    classIds,
    classes,
    students: items
  };
};

export const getStudents = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    const { students, classes } = await getTeacherScopedStudents(req.user._id, req.query);
    res.json({
      items: students,
      classes: classes.map((classRoom) => ({
        _id: classRoom._id,
        name: classRoom.name,
        code: classRoom.code,
        formation: classRoom.formation
      }))
    });
    return;
  }

  const filter = buildAdminStudentFilter(req.query);

  res.json(await User.find(filter).select("-password").populate("formations classrooms assignedCourses").sort({ createdAt: -1 }));
});

export const exportStudents = asyncHandler(async (req, res) => {
  const filter = buildAdminStudentFilter(req.query);
  const students = await User.find(filter).select("-password").populate("formations classrooms assignedCourses").sort({ lastName: 1, firstName: 1 });

  const rows = students.map((student) => ({
    Prenom: student.firstName || "",
    Nom: student.lastName || "",
    Email: student.email || "",
    Telephone: student.phone || "",
    Matricule: student.matricule || "",
    Formations: student.formations?.map((formation) => formation.name).join(", ") || "",
    Classes: student.classrooms?.map((classroom) => classroom.name).join(", ") || "",
    Cours: student.assignedCourses?.map((course) => course.title).join(", ") || "",
    Etat: student.isActive ? "Actif" : "Inactif",
    "Date creation": student.createdAt ? new Date(student.createdAt).toLocaleString("fr-FR") : ""
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: "Aucun etudiant pour les filtres selectionnes" }]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Etudiants");

  const fileBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });

  const dateSuffix = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="etudiants-${dateSuffix}.xlsx"`);
  res.send(fileBuffer);
});

export const getStudentById = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    const { students } = await getTeacherScopedStudents(req.user._id);
    const student = students.find((item) => item._id.toString() === req.params.id);

    if (!student) {
      res.status(404);
      throw new Error("Etudiant introuvable dans votre perimetre");
    }

    res.json(student);
    return;
  }

  const student = await User.findById(req.params.id).select("-password").populate("formations classrooms assignedCourses");
  if (!student || student.role !== "student") {
    res.status(404);
    throw new Error("Etudiant introuvable");
  }

  res.json(student);
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await User.create({
    ...req.body,
    formations: req.body.formations ?? [],
    role: "student"
  });

  res.status(201).json(await User.findById(student._id).select("-password").populate("formations"));
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Etudiant introuvable");
  }

  Object.entries(req.body).forEach(([key, value]) => {
    if (key !== "role" && value !== undefined && (Array.isArray(value) || value !== "")) {
      student[key] = value;
    }
  });

  await student.save();
  res.json(await User.findById(req.params.id).select("-password").populate("formations"));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
