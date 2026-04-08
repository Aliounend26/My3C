import { Message } from "../models/Message.js";
import { Conversation } from "../models/Conversation.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { ClassRoom } from "../models/ClassRoom.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";
import { getTeacherOwnedCourseIds } from "../utils/teacherAccess.js";

const populateMessage = (query) => query.populate("conversation from to course classRoom");

const getTeacherOwnedClasses = async (teacherId) => {
  const courses = await CourseGroup.find({ teacher: teacherId }).select("classRoom");
  return [...new Set(courses.map((course) => course.classRoom?.toString()).filter(Boolean))];
};

const ensureStudentCanMessage = async (user, toUserId, courseId, res) => {
  const recipient = await User.findById(toUserId).populate("assignedCourses classrooms");
  if (!recipient) {
    res.status(404);
    throw new Error("Destinataire introuvable");
  }

  const userClassrooms = (user.classrooms || []).map((room) => room.toString());
  const recipientClassrooms = (recipient.classrooms || []).map((room) => room.toString());
  const sameClass = userClassrooms.some((roomId) => recipientClassrooms.includes(roomId));

  const userCourses = (user.assignedCourses || []).map((course) => course.toString());
  const recipientCourses = (recipient.assignedCourses || []).map((course) => course.toString());
  const sameCourse = courseId && userCourses.includes(courseId.toString()) && recipientCourses.includes(courseId.toString());

  let teacherOfCourse = false;
  if (courseId && recipient.role === "teacher") {
    const course = await CourseGroup.findById(courseId);
    teacherOfCourse = course && course.teacher?.toString() === recipient._id.toString();
  }

  if (!sameClass && !sameCourse && !teacherOfCourse) {
    res.status(403);
    throw new Error("Vous ne pouvez pas envoyer de message a ce destinataire");
  }
};

const ensureTeacherCanMessageStudent = async (teacher, recipientId, res, courseId) => {
  const teacherCourseIds = await getTeacherOwnedCourseIds(teacher._id);
  const recipient = await User.findById(recipientId).populate("assignedCourses classrooms");

  if (!recipient || recipient.role !== "student") {
    res.status(404);
    throw new Error("Etudiant introuvable");
  }

  const recipientCourseIds = (recipient.assignedCourses || []).map((course) => (course._id || course).toString());
  const sharedCourseIds = recipientCourseIds.filter((id) => teacherCourseIds.includes(id));

  if (!sharedCourseIds.length) {
    res.status(403);
    throw new Error("Vous ne pouvez pas contacter cet etudiant");
  }

  if (courseId && !sharedCourseIds.includes(courseId.toString())) {
    res.status(403);
    throw new Error("Cet etudiant n'est pas inscrit a ce cours");
  }

  return {
    recipient,
    courseId: courseId || sharedCourseIds[0]
  };
};

const ensureTeacherOwnsCourse = async (teacherId, courseId, res) => {
  const course = await CourseGroup.findById(courseId).populate("classRoom");
  if (!course || course.teacher?.toString() !== teacherId.toString()) {
    res.status(403);
    throw new Error("Vous ne pouvez pas utiliser ce cours");
  }
  return course;
};

const ensureTeacherOwnsClass = async (teacherId, classId, res) => {
  const classRoom = await ClassRoom.findById(classId).populate("students formation");
  if (!classRoom) {
    res.status(404);
    throw new Error("Classe introuvable");
  }

  const ownedClassIds = await getTeacherOwnedClasses(teacherId);
  if (!ownedClassIds.includes(classRoom._id.toString())) {
    res.status(403);
    throw new Error("Vous ne pouvez pas utiliser cette classe");
  }

  return classRoom;
};

const getOrCreateConversation = async ({ participants, courseId, classRoomId, type }) => {
  const uniqueParticipants = [...new Set(participants.map((id) => id.toString()))].sort();
  let conversation = await Conversation.findOne({
    participants: { $all: uniqueParticipants, $size: uniqueParticipants.length },
    course: courseId || null,
    classRoom: classRoomId || null,
    type
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: uniqueParticipants,
      course: courseId || undefined,
      classRoom: classRoomId || undefined,
      type
    });
  }

  return conversation;
};

const createMessagesForRecipients = async ({ fromId, recipients, body, subject, courseId, classRoomId, deliveryType, conversationType }) => {
  const conversation = await getOrCreateConversation({
    participants: [fromId, ...recipients.map((recipient) => recipient._id)],
    courseId,
    classRoomId,
    type: conversationType
  });

  const createdMessages = await Message.insertMany(
    recipients.map((recipient) => ({
      from: fromId,
      to: recipient._id,
      course: courseId || undefined,
      classRoom: classRoomId || undefined,
      subject: subject || "",
      deliveryType,
      body,
      conversation: conversation._id
    }))
  );

  return populateMessage(Message.find({ _id: { $in: createdMessages.map((item) => item._id) } })).sort({ createdAt: -1 });
};

export const getMessages = asyncHandler(async (req, res) => {
  const filter = req.user.role === "superadmin" ? {} : { $or: [{ from: req.user._id }, { to: req.user._id }] };

  if (req.query.course) {
    if (req.user.role === "student") {
      await ensureStudentCanAccessCourse(req.user, req.query.course, res);
    }
    filter.course = req.query.course;
  }

  if (req.query.classId) {
    filter.classRoom = req.query.classId;
  }

  if (req.query.deliveryType) {
    filter.deliveryType = req.query.deliveryType;
  }

  if (req.query.conversation) {
    filter.conversation = req.query.conversation;
  }

  const messages = await populateMessage(Message.find(filter)).sort({ createdAt: 1 });
  res.json(messages);
});

export const createMessage = asyncHandler(async (req, res) => {
  if (req.user.role === "student") {
    await ensureStudentCanMessage(req.user, req.body.to, req.body.course, res);
  }

  if (req.user.role === "teacher") {
    const { recipient, courseId } = await ensureTeacherCanMessageStudent(req.user, req.body.to, res, req.body.course);
    const messages = await createMessagesForRecipients({
      fromId: req.user._id,
      recipients: [recipient],
      body: req.body.body,
      subject: req.body.subject,
      courseId,
      deliveryType: "direct",
      conversationType: "direct"
    });
    res.status(201).json(messages[0]);
    return;
  }

  const conversation = await getOrCreateConversation({
    participants: [req.user._id, req.body.to],
    courseId: req.body.course,
    type: "direct"
  });
  const message = await Message.create({
    ...req.body,
    subject: req.body.subject || "",
    deliveryType: "direct",
    from: req.user._id,
    conversation: conversation?._id
  });
  res.status(201).json(await populateMessage(Message.findById(message._id)));
});

export const createTeacherStudentMessage = asyncHandler(async (req, res) => {
  const { recipient, courseId } = await ensureTeacherCanMessageStudent(req.user, req.params.studentId, res, req.body.courseId);
  const messages = await createMessagesForRecipients({
    fromId: req.user._id,
    recipients: [recipient],
    body: req.body.body,
    subject: req.body.subject,
    courseId,
    deliveryType: "direct",
    conversationType: "direct"
  });
  res.status(201).json({ count: messages.length, messages });
});

export const createTeacherCourseMessage = asyncHandler(async (req, res) => {
  const course = await ensureTeacherOwnsCourse(req.user._id, req.params.courseId, res);
  const recipients = await User.find({ role: "student", assignedCourses: course._id }).select("_id");

  if (!recipients.length) {
    res.status(400);
    throw new Error("Aucun etudiant n'est inscrit a ce cours");
  }

  const messages = await createMessagesForRecipients({
    fromId: req.user._id,
    recipients,
    body: req.body.body,
    subject: req.body.subject || course.title,
    courseId: course._id,
    classRoomId: course.classRoom?._id,
    deliveryType: "course",
    conversationType: "course"
  });

  res.status(201).json({ count: messages.length, messages });
});

export const createTeacherClassMessage = asyncHandler(async (req, res) => {
  const classRoom = await ensureTeacherOwnsClass(req.user._id, req.params.classId, res);
  const recipients = await User.find({ _id: { $in: classRoom.students || [] }, role: "student" }).select("_id");

  if (!recipients.length) {
    res.status(400);
    throw new Error("Aucun etudiant n'est rattache a cette classe");
  }

  const messages = await createMessagesForRecipients({
    fromId: req.user._id,
    recipients,
    body: req.body.body,
    subject: req.body.subject || classRoom.name,
    classRoomId: classRoom._id,
    deliveryType: "class",
    conversationType: "class"
  });

  res.status(201).json({ count: messages.length, messages });
});

export const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findOneAndUpdate({ _id: req.params.id, to: req.user._id }, { isRead: true }, { new: true });
  if (!message) {
    res.status(404);
    throw new Error("Message introuvable");
  }
  res.json(message);
});
