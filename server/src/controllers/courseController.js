import crypto from "crypto";
import { CourseGroup } from "../models/CourseGroup.js";
import { CourseSession } from "../models/CourseSession.js";
import { QrCode } from "../models/QrCode.js";
import { User } from "../models/User.js";
import { generateCourseQr } from "../services/qrService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse, getStudentAllowedCourseIds } from "../utils/studentAccess.js";
import { createNotifications, getUsersByRoles } from "../utils/notificationHelper.js";

const uniqueIds = (items = []) => [...new Set(items.map((item) => item?.toString?.()).filter(Boolean))];

const recalculateTeacherAssignments = async (teacherId) => {
  if (!teacherId) return;

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher") return;

  const groups = await CourseGroup.find({ teacher: teacherId }).select("_id formation classRoom");
  teacher.assignedCourses = groups.map((group) => group._id);
  teacher.formations = uniqueIds(groups.map((group) => group.formation));
  teacher.classrooms = uniqueIds(groups.map((group) => group.classRoom));
  await teacher.save();
};

const syncCourseGroupStudents = async (group, studentIds = []) => {
  const normalizedStudentIds = uniqueIds(studentIds);
  const currentStudents = await User.find({ role: "student", assignedCourses: group._id }).select("_id assignedCourses formations classrooms");
  const currentStudentIds = currentStudents.map((student) => student._id.toString());

  const removedStudentIds = currentStudentIds.filter((studentId) => !normalizedStudentIds.includes(studentId));
  const addedStudents = await User.find({ _id: { $in: normalizedStudentIds }, role: "student" });

  if (removedStudentIds.length) {
    await User.updateMany({ _id: { $in: removedStudentIds } }, { $pull: { assignedCourses: group._id } });
  }

  for (const student of addedStudents) {
    student.assignedCourses = uniqueIds([...(student.assignedCourses || []), group._id]);
    student.formations = uniqueIds([...(student.formations || []), group.formation]);
    if (group.classRoom) {
      student.classrooms = uniqueIds([...(student.classrooms || []), group.classRoom]);
    }
    await student.save();
  }
};

const buildExpiryDate = (date, endTime) => {
  const expiry = new Date(`${date}T${endTime}:00`);
  expiry.setMinutes(expiry.getMinutes() + 20);
  return expiry;
};

const calculateDurationHours = (startTime, endTime) => {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  return Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
};

const getCourseRoomFromType = (courseType) => (courseType === "en_ligne" ? "En ligne" : "Lieu 3C");

const buildSessionPayload = (payload, group) => ({
  title: payload.title,
  courseGroupId: group._id.toString(),
  courseGroupLabel: group.title,
  description: payload.description ?? group.description,
  date: payload.date,
  startTime: payload.startTime,
  endTime: payload.endTime,
  durationHours: payload.durationHours || calculateDurationHours(payload.startTime, payload.endTime),
  courseType: payload.courseType || group.courseType,
  room: getCourseRoomFromType(payload.courseType || group.courseType),
  instructor: payload.instructor || group.instructor,
  formation: payload.formation || group.formation,
  qrToken: crypto.randomBytes(16).toString("hex"),
  qrExpiresAt: payload.qrExpiresAt || buildExpiryDate(payload.date, payload.endTime)
});

const getDatesInRange = (startDate, endDate, weekdays) => {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

export const getCourses = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "student") {
    const allowedCourseIds = await getStudentAllowedCourseIds(req.user);
    filter.courseGroupId = { $in: allowedCourseIds };
  }

  res.json(await CourseSession.find(filter).populate("formation").sort({ date: -1, startTime: -1 }));
});

export const getCourseGroups = asyncHandler(async (req, res) => {
  const role = req.user.role;
  let filter = {};

  if (role === "teacher") {
    filter.teacher = req.user._id;
  } else if (role === "student") {
    const allowedCourseIds = await getStudentAllowedCourseIds(req.user);
    filter._id = { $in: allowedCourseIds };
  }

  const groups = await CourseGroup.find(filter).populate("formation teacher classRoom").sort({ createdAt: -1 });
  const groupIds = groups.map((group) => group._id.toString());
  const sessions = await CourseSession.find({ courseGroupId: { $in: groupIds } }).populate("formation").sort({ date: 1, startTime: 1 });

  const sessionsByGroup = sessions.reduce((accumulator, session) => {
    const key = session.courseGroupId;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(session);
    return accumulator;
  }, {});

  res.json(
    groups.map((group) => ({
      ...group.toObject(),
      sessions: sessionsByGroup[group._id.toString()] || []
    }))
  );
});

export const getCourseGroupDetail = asyncHandler(async (req, res) => {
  const group = await CourseGroup.findById(req.params.groupId).populate("formation teacher classRoom");
  if (!group) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  if (req.user.role === "teacher" && group.teacher?._id?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Acces refuse a ce cours");
  }

  await ensureStudentCanAccessCourse(req.user, group._id, res);

  const sessions = await CourseSession.find({ courseGroupId: req.params.groupId }).populate("formation").sort({ date: 1, startTime: 1 });
  const students = await User.find({ role: "student", assignedCourses: group._id }).select("-password").populate("formations classrooms assignedCourses");

  res.json({
    ...group.toObject(),
    sessions,
    students
  });
});

export const getCourseGroupSessions = asyncHandler(async (req, res) => {
  const group = await CourseGroup.findById(req.params.groupId);
  if (!group) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  if (req.user.role === "teacher" && group.teacher?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Acces refuse a ce cours");
  }

  await ensureStudentCanAccessCourse(req.user, group._id, res);

  const sessions = await CourseSession.find({ courseGroupId: req.params.groupId }).populate("formation").sort({ date: 1, startTime: 1 });
  res.json(sessions);
});

export const createCourseGroup = asyncHandler(async (req, res) => {
  const group = await CourseGroup.create(req.body);
  await recalculateTeacherAssignments(group.teacher);
  const [teacher, admins, superadmins] = await Promise.all([
    group.teacher ? User.findById(group.teacher).select("_id role firstName lastName") : null,
    getUsersByRoles("admin"),
    getUsersByRoles("superadmin")
  ]);
  await createNotifications([
    ...(teacher
      ? [
          {
            userId: teacher._id,
            role: teacher.role,
            type: "course_assigned",
            priority: "medium",
            title: "Nouveau cours assigne",
            message: `Le cours "${group.title}" vous a ete assigne.`,
            link: `/courses/${group._id}`,
            metadata: { courseId: group._id.toString() }
          }
        ]
      : []),
    {
      userId: req.user._id,
      role: req.user.role,
      type: "admin_action_success",
      priority: "low",
      title: "Cours cree",
      message: `Le cours "${group.title}" a ete cree avec succes.`,
      link: "/courses",
      metadata: { courseId: group._id.toString() }
    },
    ...admins
      .filter((admin) => admin._id.toString() !== req.user._id.toString())
      .map((admin) => ({
        userId: admin._id,
        role: admin.role,
        type: "admin_action_success",
        priority: "low",
        title: "Nouveau cours cree",
        message: `${req.user.firstName} ${req.user.lastName} a cree le cours "${group.title}".`,
        link: "/courses",
        metadata: { courseId: group._id.toString() }
      })),
    ...superadmins
      .filter((superadmin) => superadmin._id.toString() !== req.user._id.toString())
      .map((superadmin) => ({
      userId: superadmin._id,
      role: superadmin.role,
      type: "activity_important",
      priority: "low",
      title: "Nouveau cours cree",
      message: `Le cours "${group.title}" a ete cree sur la plateforme.`,
      link: "/courses",
      metadata: { courseId: group._id.toString() }
      }))
  ]);
  res.status(201).json(await CourseGroup.findById(group._id).populate("formation"));
});

export const updateCourseGroup = asyncHandler(async (req, res) => {
  const group = await CourseGroup.findById(req.params.groupId);

  if (!group) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  const previousTeacherId = group.teacher?.toString();
  const allowedFields = ["title", "description", "sessionMode", "courseType", "instructor", "formation", "teacher", "classRoom"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      group[field] = req.body[field];
    }
  });

  await group.save();
  await recalculateTeacherAssignments(previousTeacherId);
  await recalculateTeacherAssignments(group.teacher);

  const notifications = [
    {
      userId: req.user._id,
      role: req.user.role,
      type: "admin_action_success",
      priority: "low",
      title: "Cours mis a jour",
      message: `Le cours "${group.title}" a ete mis a jour.`,
      link: "/courses",
      metadata: { courseId: group._id.toString() }
    }
  ];

  if (group.teacher && group.teacher.toString() !== previousTeacherId) {
    const teacher = await User.findById(group.teacher).select("_id role firstName lastName");
    if (teacher) {
      notifications.push({
        userId: teacher._id,
        role: teacher.role,
        type: "course_assigned",
        priority: "medium",
        title: "Cours assigne",
        message: `Le cours "${group.title}" vous a ete assigne.`,
        link: `/courses/${group._id}`,
        metadata: { courseId: group._id.toString() }
      });
    }
  }

  await createNotifications(notifications);

  res.json(await CourseGroup.findById(group._id).populate("formation teacher classRoom"));
});

export const getCourseGroupStudents = asyncHandler(async (req, res) => {
  const group = await CourseGroup.findById(req.params.groupId).select("_id");

  if (!group) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  const students = await User.find({ role: "student", assignedCourses: group._id }).select("-password").populate("formations classrooms assignedCourses");
  res.json(students);
});

export const updateCourseGroupStudents = asyncHandler(async (req, res) => {
  const group = await CourseGroup.findById(req.params.groupId);

  if (!group) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  await syncCourseGroupStudents(group, req.body.studentIds || []);
  const students = await User.find({ role: "student", assignedCourses: group._id }).select("-password").populate("formations classrooms assignedCourses");
  await createNotifications([
    {
      userId: req.user._id,
      role: req.user.role,
      type: "admin_action_success",
      priority: "low",
      title: "Affectation des etudiants mise a jour",
      message: `Les inscriptions des etudiants au cours "${group.title}" ont ete mises a jour.`,
      link: "/courses",
      metadata: { courseId: group._id.toString(), studentCount: students.length }
    },
    ...students.map((student) => ({
      userId: student._id,
      role: student.role,
      type: "course_assigned",
      priority: "medium",
      title: "Cours disponible",
      message: `Vous etes inscrit au cours "${group.title}".`,
      link: `/courses/${group._id}`,
      metadata: { courseId: group._id.toString() }
    }))
  ]);
  res.json(students);
});

export const createCourse = asyncHandler(async (req, res) => {
  const fallbackGroup = await CourseGroup.create({
    title: req.body.courseGroupLabel || req.body.title,
    description: req.body.description || "",
    sessionMode: "single",
    courseType: req.body.courseType || "presentiel",
    instructor: req.body.instructor || "",
    formation: req.body.formation,
    teacher: req.body.teacher,
    classRoom: req.body.classRoom
  });
  await recalculateTeacherAssignments(fallbackGroup.teacher);

  const course = await CourseSession.create(buildSessionPayload(req.body, fallbackGroup));
  const qrCode = await generateCourseQr(course);
  res.status(201).json({ ...(await course.populate("formation")).toObject(), qrCode });
});

export const createGroupSession = asyncHandler(async (req, res) => {
  const group = await CourseGroup.findById(req.params.groupId);

  if (!group) {
    res.status(404);
    throw new Error("Cours introuvable");
  }

  const course = await CourseSession.create(buildSessionPayload(req.body, group));
  const qrCode = await generateCourseQr(course);
  res.status(201).json({ ...(await course.populate("formation")).toObject(), qrCode });
});

export const createCourseRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, weekdays = [], startTime, endTime, ...groupPayload } = req.body;

  if (!startDate || !endDate || !weekdays.length || !startTime || !endTime) {
    res.status(400);
    throw new Error("Plage de cours invalide");
  }

  const group = await CourseGroup.create({
    title: groupPayload.title,
    description: groupPayload.description || "",
    sessionMode: "multiple",
    courseType: groupPayload.courseType || "presentiel",
    instructor: groupPayload.instructor || "",
    formation: groupPayload.formation,
    teacher: groupPayload.teacher,
    classRoom: groupPayload.classRoom
  });
  await recalculateTeacherAssignments(group.teacher);

  const dates = getDatesInRange(startDate, endDate, weekdays.map(Number));
  const createdCourses = [];

  for (const date of dates) {
    const course = await CourseSession.create(
      buildSessionPayload(
        {
          ...groupPayload,
          date,
          startTime,
          endTime,
          durationHours: groupPayload.durationHours
        },
        group
      )
    );

    const qrCode = await generateCourseQr(course);
    createdCourses.push({
      ...(await course.populate("formation")).toObject(),
      qrCode
    });
  }

  res.status(201).json({
    group: await CourseGroup.findById(group._id).populate("formation"),
    count: createdCourses.length,
    courses: createdCourses
  });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const existing = await CourseSession.findById(req.params.id);

  if (!existing) {
    res.status(404);
    throw new Error("Seance introuvable");
  }

  const group = await CourseGroup.findById(existing.courseGroupId);

  const course = await CourseSession.findByIdAndUpdate(
    req.params.id,
    {
      ...buildSessionPayload({ ...existing.toObject(), ...req.body }, group),
      qrToken: existing.qrToken
    },
    { new: true, runValidators: true }
  ).populate("formation");

  const qrCode = await generateCourseQr(course);
  res.json({ ...course.toObject(), qrCode });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await CourseSession.findById(req.params.id);

  if (!course) {
    res.json({ success: true });
    return;
  }

  await Promise.all([CourseSession.findByIdAndDelete(req.params.id), QrCode.findOneAndDelete({ course: req.params.id })]);

  const remainingSessions = await CourseSession.countDocuments({ courseGroupId: course.courseGroupId });
  if (remainingSessions === 0) {
    const group = await CourseGroup.findById(course.courseGroupId).select("teacher");
    await CourseGroup.findByIdAndDelete(course.courseGroupId);
    await recalculateTeacherAssignments(group?.teacher);
  }

  res.json({ success: true });
});
