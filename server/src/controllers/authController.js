import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notificationHelper.js";

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate("formations");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Email ou mot de passe invalide");
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    token: signToken(user._id, user.role),
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      matricule: user.matricule,
      formations: user.formations
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  const allowedFields = ["firstName", "lastName", "email", "phone", "avatar"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();
  await createNotification({
    userId: user._id,
    role: user.role,
    type: "profile_updated",
    priority: "low",
    title: "Profil mis a jour",
    message: "Vos informations personnelles ont ete mises a jour avec succes.",
    link: "/profile",
    metadata: { userId: user._id.toString() }
  });
  res.json(await User.findById(user._id).select("-password").populate("formations"));
});

export const updateMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  const matches = await user.comparePassword(currentPassword);

  if (!matches) {
    res.status(400);
    throw new Error("Mot de passe actuel incorrect");
  }

  user.password = newPassword;
  await user.save();
  await createNotification({
    userId: user._id,
    role: user.role,
    type: "password_updated",
    priority: "medium",
    title: "Mot de passe modifie",
    message: "Votre mot de passe a ete modifie avec succes.",
    link: "/profile",
    metadata: { userId: user._id.toString() }
  });

  res.json({ success: true, message: "Mot de passe mis a jour" });
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Aucun fichier image recu");
  }

  user.avatar = `/uploads/avatars/${req.file.filename}`;
  await user.save();
  await createNotification({
    userId: user._id,
    role: user.role,
    type: "profile_updated",
    priority: "low",
    title: "Photo de profil mise a jour",
    message: "Votre photo de profil a ete mise a jour.",
    link: "/profile",
    metadata: { userId: user._id.toString() }
  });

  res.json(await User.findById(user._id).select("-password").populate("formations"));
});
