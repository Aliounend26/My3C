import { Notification } from "../models/Notification.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { User } from "../models/User.js";

const ROLE_BASE_PATHS = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  superadmin: "/superadmin"
};

const uniqueIds = (items = []) => [...new Set(items.map((item) => item?.toString?.()).filter(Boolean))];

const trimMessage = (value = "", maxLength = 160) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
};

export const buildRoleLink = (role, link = "") => {
  if (!link) {
    return ROLE_BASE_PATHS[role] || "/";
  }

  if (link.startsWith("/student") || link.startsWith("/teacher") || link.startsWith("/admin") || link.startsWith("/superadmin")) {
    return link;
  }

  if (link.startsWith("/")) {
    return `${ROLE_BASE_PATHS[role] || ""}${link}`;
  }

  return `${ROLE_BASE_PATHS[role] || ""}/${link}`;
};

export const createNotification = async ({
  userId,
  role,
  type,
  title,
  message,
  link = "",
  priority = "medium",
  metadata = {}
}) => {
  if (!userId || !role || !type || !title || !message) {
    return null;
  }

  return Notification.create({
    user: userId,
    role,
    type,
    title: trimMessage(title, 90),
    message: trimMessage(message, 220),
    link: buildRoleLink(role, link),
    priority,
    metadata
  });
};

export const createNotifications = async (items = []) => {
  const payloads = items
    .filter(Boolean)
    .map((item) => ({
      user: item.userId,
      role: item.role,
      type: item.type,
      title: trimMessage(item.title, 90),
      message: trimMessage(item.message, 220),
      link: buildRoleLink(item.role, item.link),
      priority: item.priority || "medium",
      metadata: item.metadata || {}
    }))
    .filter((item) => item.user && item.role && item.type && item.title && item.message);

  if (!payloads.length) {
    return [];
  }

  return Notification.insertMany(payloads);
};

export const getUsersByRoles = async (roles = []) => {
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  return User.find({ role: { $in: normalizedRoles }, isActive: { $ne: false } }).select("_id role firstName lastName");
};

export const getCourseAudience = async (courseId) => {
  if (!courseId) {
    return {
      course: null,
      teacher: null,
      students: [],
      admins: [],
      superadmins: []
    };
  }

  const course = await CourseGroup.findById(courseId).populate("teacher", "_id role firstName lastName");
  if (!course) {
    return {
      course: null,
      teacher: null,
      students: [],
      admins: [],
      superadmins: []
    };
  }

  const [students, admins, superadmins] = await Promise.all([
    User.find({ role: "student", assignedCourses: course._id, isActive: { $ne: false } }).select("_id role firstName lastName"),
    User.find({ role: "admin", isActive: { $ne: false } }).select("_id role firstName lastName"),
    User.find({ role: "superadmin", isActive: { $ne: false } }).select("_id role firstName lastName")
  ]);

  return {
    course,
    teacher: course.teacher || null,
    students,
    admins,
    superadmins
  };
};

export const mapRecipientsToNotifications = (recipients = [], buildPayload) =>
  recipients
    .map((recipient) => {
      const payload = buildPayload(recipient);
      if (!payload) return null;
      return {
        userId: recipient._id,
        role: recipient.role,
        ...payload
      };
    })
    .filter(Boolean);

export const getUniqueUserIds = uniqueIds;
