import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureStudentCanAccessCourse } from "../utils/studentAccess.js";

const ensureParticipantsAllowed = async (user, participants, courseId, res) => {
  const uniqueParticipants = [...new Set(participants.map((id) => id.toString()))];
  if (!uniqueParticipants.includes(user._id.toString())) {
    res.status(403);
    throw new Error("Vous devez etre participant a la conversation");
  }

  if (courseId && user.role === "student") {
    await ensureStudentCanAccessCourse(user, courseId, res);
  }

  const users = await User.find({ _id: { $in: uniqueParticipants } });
  if (users.length !== uniqueParticipants.length) {
    res.status(404);
    throw new Error("Participant introuvable");
  }
};

export const getConversations = asyncHandler(async (req, res) => {
  const filter = { participants: req.user._id };
  if (req.query.course) {
    filter.course = req.query.course;
    if (req.user.role === "student") {
      await ensureStudentCanAccessCourse(req.user, req.query.course, res);
    }
  }

  const conversations = await Conversation.find(filter).populate("participants course").sort({ updatedAt: -1 });
  res.json(conversations);
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id).populate("participants course");
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation introuvable");
  }

  if (!conversation.participants.map((id) => id.toString()).includes(req.user._id.toString())) {
    res.status(403);
    throw new Error("Acces refuse a cette conversation");
  }

  res.json(conversation);
});

export const createConversation = asyncHandler(async (req, res) => {
  const { participants = [], course, type = "direct" } = req.body;
  if (!participants.length || participants.length < 2) {
    res.status(400);
    throw new Error("Au moins deux participants sont requis");
  }

  const conversationParticipants = [...new Set(participants.map((id) => id.toString()))];
  if (!conversationParticipants.includes(req.user._id.toString())) {
    conversationParticipants.push(req.user._id.toString());
  }

  if (course && req.user.role === "student") {
    await ensureStudentCanAccessCourse(req.user, course, res);
  }

  await ensureParticipantsAllowed(req.user, conversationParticipants, course, res);

  let conversation = await Conversation.findOne({ participants: { $all: conversationParticipants, $size: conversationParticipants.length }, course, type });
  if (!conversation) {
    conversation = await Conversation.create({ participants: conversationParticipants, course, type });
  }

  res.status(201).json(await Conversation.findById(conversation._id).populate("participants course"));
});
