import { User } from "../models/User.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotifications, getUsersByRoles } from "../utils/notificationHelper.js";

const populateUser = (query) =>
  query.select("-password").populate("formations classrooms").populate({
    path: "assignedCourses",
    populate: [
      { path: "formation" },
      { path: "classRoom" },
      { path: "teacher", select: "firstName lastName email specialty isActive" }
    ]
  });

const uniqueIds = (items = []) => [...new Set(items.map((item) => item?.toString?.()).filter(Boolean))];
const normalizeOptionalUniqueValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
};

const deriveTeacherScopeFromCourses = async (courseIds = []) => {
  if (!courseIds.length) {
    return { formations: [], classrooms: [] };
  }

  const courses = await CourseGroup.find({ _id: { $in: courseIds } }).select("formation classRoom");
  return {
    formations: uniqueIds(courses.map((course) => course.formation)),
    classrooms: uniqueIds(courses.map((course) => course.classRoom))
  };
};

const recalculateTeachersFromCourses = async (teacherIds = []) => {
  const normalizedTeacherIds = uniqueIds(teacherIds);
  if (!normalizedTeacherIds.length) return;

  for (const teacherId of normalizedTeacherIds) {
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher") continue;

    const courses = await CourseGroup.find({ teacher: teacherId }).select("_id formation classRoom");
    teacher.assignedCourses = courses.map((course) => course._id);
    teacher.formations = uniqueIds(courses.map((course) => course.formation));
    teacher.classrooms = uniqueIds(courses.map((course) => course.classRoom));
    await teacher.save();
  }
};

const syncTeacherAssignments = async (teacherId, requestedCourseIds = []) => {
  const normalizedCourseIds = uniqueIds(requestedCourseIds);
  const currentCourses = await CourseGroup.find({ teacher: teacherId }).select("_id");
  const currentCourseIds = currentCourses.map((course) => course._id.toString());

  const removedCourseIds = currentCourseIds.filter((courseId) => !normalizedCourseIds.includes(courseId));
  const newCourses = await CourseGroup.find({ _id: { $in: normalizedCourseIds } }).select("_id teacher");
  const displacedTeacherIds = uniqueIds(
    newCourses
      .map((course) => {
        const ownerId = course.teacher?.toString();
        if (ownerId && ownerId !== teacherId.toString()) {
          return ownerId;
        }
        return null;
      })
      .filter(Boolean)
  );

  if (removedCourseIds.length) {
    await CourseGroup.updateMany({ _id: { $in: removedCourseIds }, teacher: teacherId }, { $unset: { teacher: "" } });
  }

  if (normalizedCourseIds.length) {
    await CourseGroup.updateMany({ _id: { $in: normalizedCourseIds } }, { $set: { teacher: teacherId } });
  }

  await recalculateTeachersFromCourses([teacherId, ...displacedTeacherIds]);
};

export const getUsers = asyncHandler(async (req, res) => {
  const role = req.query.role;
  const filter = role ? { role } : {};

  if (req.user.role === "admin") {
    filter.role = role || { $in: ["teacher", "student", "admin"] };

    if (role === "superadmin") {
      res.status(403);
      throw new Error("Vous ne pouvez pas consulter les superadmins");
    }
  }

  const users = await populateUser(User.find(filter));
  res.json(users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await populateUser(User.findById(req.params.id));

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  if (req.user.role === "admin" && user.role === "superadmin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas consulter un superadmin");
  }

  res.json(user);
});

export const createUser = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    matricule: normalizeOptionalUniqueValue(req.body.matricule),
    phone: normalizeOptionalUniqueValue(req.body.phone)
  };
  const requestedRole = payload.role || "student";

  if (req.user.role !== "superadmin" && requestedRole === "superadmin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas creer un superadmin");
  }

  if (req.user.role === "admin" && !["teacher", "student"].includes(requestedRole)) {
    res.status(403);
    throw new Error("Un admin peut uniquement creer des etudiants ou des formateurs");
  }

  let formations = payload.formations ?? [];
  let classrooms = payload.classrooms ?? [];
  const assignedCourses = payload.assignedCourses ?? [];

  if (requestedRole === "teacher") {
    const derivedScope = await deriveTeacherScopeFromCourses(assignedCourses);
    formations = derivedScope.formations;
    classrooms = derivedScope.classrooms;
  }

  const user = await User.create({
    ...payload,
    role: requestedRole,
    formations,
    classrooms,
    assignedCourses
  });

  if (requestedRole === "teacher") {
    await syncTeacherAssignments(user._id, assignedCourses);
  }

  const superadmins = await getUsersByRoles("superadmin");
  await createNotifications([
    {
      userId: user._id,
      role: user.role,
      type: "account_created",
      priority: "medium",
      title: "Compte cree",
      message: `Votre compte My 3C a ete cree avec le role ${user.role}.`,
      link: "/profile",
      metadata: { userId: user._id.toString() }
    },
    {
      userId: req.user._id,
      role: req.user.role,
      type: "admin_action_success",
      priority: "low",
      title: "Utilisateur cree",
      message: `${user.firstName} ${user.lastName} a ete cree avec succes.`,
      link: req.user.role === "teacher" ? "/profile" : "/users",
      metadata: { targetUserId: user._id.toString(), targetRole: user.role }
    },
    ...superadmins
      .filter((superadmin) => superadmin._id.toString() !== req.user._id.toString())
      .map((superadmin) => ({
        userId: superadmin._id,
        role: superadmin.role,
        type: "activity_important",
        priority: ["admin", "teacher"].includes(user.role) ? "medium" : "low",
        title: "Nouveau compte cree",
        message: `${req.user.firstName} ${req.user.lastName} a cree un compte ${user.role} : ${user.firstName} ${user.lastName}.`,
        link: "/users",
        metadata: { targetUserId: user._id.toString(), targetRole: user.role }
      }))
  ]);

  res.status(201).json(await populateUser(User.findById(user._id)));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  if (req.user.role !== "superadmin" && user.role === "superadmin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas modifier un superadmin");
  }

  if (req.user.role === "admin" && user.role === "admin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas modifier un autre admin");
  }

  if (req.user.role !== "superadmin" && req.body.role === "superadmin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas attribuer le role superadmin");
  }

  if (req.user.role === "admin" && req.body.role && !["teacher", "student"].includes(req.body.role)) {
    res.status(403);
    throw new Error("Un admin peut uniquement gerer des comptes etudiant ou formateur");
  }

  const previousActive = user.isActive;
  const previousRole = user.role;
  const allowed = ["firstName", "lastName", "email", "phone", "specialty", "role", "matricule", "formations", "classrooms", "assignedCourses", "isActive"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "matricule" || field === "phone") {
        user[field] = normalizeOptionalUniqueValue(req.body[field]);
        return;
      }

      user[field] = req.body[field];
    }
  });

  if (user.role === "teacher") {
    const assignedCourses = req.body.assignedCourses ?? user.assignedCourses ?? [];
    const derivedScope = await deriveTeacherScopeFromCourses(assignedCourses);
    user.formations = derivedScope.formations;
    user.classrooms = derivedScope.classrooms;
    user.assignedCourses = assignedCourses;
  }

  await user.save();

  if (user.role === "teacher") {
    await syncTeacherAssignments(user._id, user.assignedCourses || []);
  }

  await createNotifications([
    {
      userId: user._id,
      role: user.role,
      type: user.isActive !== previousActive ? "account_status_changed" : "profile_updated",
      priority: user.isActive !== previousActive ? "medium" : "low",
      title: user.isActive !== previousActive ? "Statut du compte mis a jour" : "Compte mis a jour",
      message:
        user.isActive !== previousActive
          ? `Votre compte est maintenant ${user.isActive ? "actif" : "desactive"}.`
          : "Les informations de votre compte ont ete mises a jour par l'administration.",
      link: "/profile",
      metadata: { userId: user._id.toString(), previousRole, currentRole: user.role }
    },
    {
      userId: req.user._id,
      role: req.user.role,
      type: "admin_action_success",
      priority: "low",
      title: "Utilisateur mis a jour",
      message: `Le compte de ${user.firstName} ${user.lastName} a ete mis a jour.`,
      link: "/users",
      metadata: { targetUserId: user._id.toString(), previousRole, currentRole: user.role }
    }
  ]);

  res.json(await populateUser(User.findById(user._id)));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  if (req.user.role !== "superadmin" && user.role === "superadmin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas supprimer un superadmin");
  }

  if (req.user.role === "admin" && user.role === "admin") {
    res.status(403);
    throw new Error("Vous ne pouvez pas supprimer un autre admin");
  }

  if (user.role === "teacher") {
    await CourseGroup.updateMany({ teacher: user._id }, { $unset: { teacher: "" } });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
