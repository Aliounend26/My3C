import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.join(__dirname, "../../uploads/avatars");
const resourcesDirectory = path.join(__dirname, "../../uploads/resources");

fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(resourcesDirectory, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, "-");
    callback(null, `${Date.now()}-${safeBaseName}${extension}`);
  }
});

const resourceStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, resourcesDirectory);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, "-");
    callback(null, `${Date.now()}-${safeBaseName}${extension}`);
  }
});

const avatarFileFilter = (req, file, callback) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Seules les images sont autorisees"));
};

const resourceFileFilter = (req, file, callback) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/gif"
  ];

  if (allowedMimes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new Error("Type de fichier non autorisé. Autorisés: PDF, DOC, XLS, images"));
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const resourceUpload = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});
