import "../config/env.js";
import { connectDatabase } from "../config/db.js";
import { Attendance } from "../models/Attendance.js";
import { Announcement } from "../models/Announcement.js";
import { ClassRoom } from "../models/ClassRoom.js";
import { CourseGroup } from "../models/CourseGroup.js";
import { CourseSession } from "../models/CourseSession.js";
import { CourseMaterial } from "../models/CourseMaterial.js";
import { Formation } from "../models/Formation.js";
import { Lesson } from "../models/Lesson.js";
import { Message } from "../models/Message.js";
import { QrCode } from "../models/QrCode.js";
import { Quiz } from "../models/Quiz.js";
import { QuizQuestion } from "../models/QuizQuestion.js";
import { Section } from "../models/Section.js";
import { User } from "../models/User.js";
import { VideoResource } from "../models/VideoResource.js";
import { generateCourseQr } from "../services/qrService.js";
import { getAttendanceHours } from "../utils/attendance.js";

const buildDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    Attendance.deleteMany({}),
    QrCode.deleteMany({}),
    CourseSession.deleteMany({}),
    CourseGroup.deleteMany({}),
    User.deleteMany({}),
    Formation.deleteMany({})
  ]);

  const formations = await Formation.insertMany([
    { name: "Developpement Web Full Stack", code: "DWF-2026", description: "Parcours full stack moderne", totalHours: 180 },
    { name: "Data & IA Appliquee", code: "DIA-2026", description: "Parcours data analyse et IA", totalHours: 140 }
  ]);

  const superadmin = await User.create({
    firstName: "Amadou",
    lastName: "Ba",
    email: "superadmin@mypresence.local",
    password: "SuperAdmin123!",
    role: "superadmin",
    phone: "+221700000010"
  });

  const admin = await User.create({
    firstName: "Amina",
    lastName: "Diallo",
    email: "admin@mypresence.local",
    password: "Admin123!",
    role: "admin",
    phone: "+221700000000"
  });

  const teacher = await User.create({
    firstName: "Adama",
    lastName: "Ndiaye",
    email: "teacher@mypresence.local",
    password: "Teacher123!",
    role: "teacher",
    phone: "+221700000004"
  });

  const students = [];
  students.push(
    await User.create({
      firstName: "Sara",
      lastName: "Lopez",
      email: "sara@mypresence.local",
      password: "Student123!",
      role: "student",
      phone: "+221770000001",
      matricule: "MP-001",
      formations: [formations[0]._id, formations[1]._id]
    })
  );
  students.push(
    await User.create({
      firstName: "Nabil",
      lastName: "Sow",
      email: "nabil@mypresence.local",
      password: "Student123!",
      role: "student",
      phone: "+221770000002",
      matricule: "MP-002",
      formations: [formations[0]._id]
    })
  );
  students.push(
    await User.create({
      firstName: "Maya",
      lastName: "Benali",
      email: "maya@mypresence.local",
      password: "Student123!",
      role: "student",
      phone: "+221770000003",
      matricule: "MP-003",
      formations: [formations[1]._id]
    })
  );

  const dates = [buildDate(-7), buildDate(-3), buildDate(1), buildDate(2)];
  const classRooms = await ClassRoom.insertMany([
    {
      name: "Classe Full Stack",
      code: "FS-2026",
      description: "Classe dédiée aux parcours développement web.",
      formation: formations[0]._id,
      teacher: teacher._id,
      students: [students[0]._id, students[1]._id]
    },
    {
      name: "Classe Data IA",
      code: "DIA-2026",
      description: "Classe dédiée aux parcours data et intelligence artificielle.",
      formation: formations[1]._id,
      teacher: teacher._id,
      students: [students[2]._id]
    }
  ]);

  const courseGroups = await CourseGroup.insertMany([
    {
      title: "Développement Web Full Stack",
      description: "Parcours complet pour concevoir des applications modernes.",
      sessionMode: "multiple",
      courseType: "presentiel",
      instructor: "Adama Ndiaye",
      formation: formations[0]._id,
      teacher: teacher._id,
      classRoom: classRooms[0]._id
    },
    {
      title: "Data et IA Appliquée",
      description: "Tronc commun data science, machine learning et BI.",
      sessionMode: "multiple",
      courseType: "en_ligne",
      instructor: "Adama Ndiaye",
      formation: formations[1]._id,
      teacher: teacher._id,
      classRoom: classRooms[1]._id
    }
  ]);

  const courses = await CourseSession.insertMany([
    {
      title: "React avance",
      courseGroupId: courseGroups[0]._id.toString(),
      courseGroupLabel: courseGroups[0].title,
      description: "Hooks avances et architecture front.",
      date: dates[0],
      startTime: "09:00",
      endTime: "12:00",
      durationHours: 3,
      courseType: "presentiel",
      room: "Lieu 3C",
      instructor: "M. Ndiaye",
      formation: formations[0]._id,
      qrToken: "seed-react-avance",
      qrExpiresAt: new Date(`${dates[0]}T12:20:00`)
    },
    {
      title: "API Node.js",
      courseGroupId: courseGroups[0]._id.toString(),
      courseGroupLabel: courseGroups[0].title,
      description: "Express et auth JWT.",
      date: dates[1],
      startTime: "13:00",
      endTime: "16:00",
      durationHours: 3,
      courseType: "presentiel",
      room: "Lieu 3C",
      instructor: "Mme Faye",
      formation: formations[0]._id,
      qrToken: "seed-api-node",
      qrExpiresAt: new Date(`${dates[1]}T16:20:00`)
    },
    {
      title: "Fondamentaux Machine Learning",
      courseGroupId: courseGroups[1]._id.toString(),
      courseGroupLabel: courseGroups[1].title,
      description: "Introduction aux modeles supervises.",
      date: dates[2],
      startTime: "10:00",
      endTime: "13:00",
      durationHours: 3,
      courseType: "en_ligne",
      room: "En ligne",
      instructor: "Dr. Karim",
      formation: formations[1]._id,
      qrToken: "seed-ml",
      qrExpiresAt: new Date(`${dates[2]}T13:20:00`)
    },
    {
      title: "Atelier Prisma & Mongo",
      courseGroupId: courseGroups[0]._id.toString(),
      courseGroupLabel: courseGroups[0].title,
      description: "Schemas et requetes optimisees.",
      date: dates[3],
      startTime: "14:00",
      endTime: "17:00",
      durationHours: 3,
      courseType: "presentiel",
      room: "Lieu 3C",
      instructor: "Mme Sy",
      formation: formations[0]._id,
      qrToken: "seed-prisma",
      qrExpiresAt: new Date(`${dates[3]}T17:20:00`)
    }
  ]);

  await Promise.all(courses.map((course) => generateCourseQr(course)));

  await Attendance.insertMany([
    {
      student: students[0]._id,
      course: courses[0]._id,
      formation: formations[0]._id,
      status: "present",
      source: "manual",
      scannedAt: new Date(`${dates[0]}T09:05:00`),
      presenceHours: getAttendanceHours(courses[0].durationHours, "present")
    },
    {
      student: students[0]._id,
      course: courses[1]._id,
      formation: formations[0]._id,
      status: "late",
      source: "manual",
      scannedAt: new Date(`${dates[1]}T13:20:00`),
      presenceHours: getAttendanceHours(courses[1].durationHours, "late")
    },
    {
      student: students[1]._id,
      course: courses[0]._id,
      formation: formations[0]._id,
      status: "absent",
      source: "manual",
      scannedAt: new Date(`${dates[0]}T12:05:00`),
      presenceHours: getAttendanceHours(courses[0].durationHours, "absent")
    },
    {
      student: students[1]._id,
      course: courses[1]._id,
      formation: formations[0]._id,
      status: "present",
      source: "manual",
      scannedAt: new Date(`${dates[1]}T13:02:00`),
      presenceHours: getAttendanceHours(courses[1].durationHours, "present")
    },
    {
      student: students[2]._id,
      course: courses[2]._id,
      formation: formations[1]._id,
      status: "present",
      source: "manual",
      scannedAt: new Date(`${dates[2]}T10:01:00`),
      presenceHours: getAttendanceHours(courses[2].durationHours, "present")
    }
  ]);

  const sections = await Section.insertMany([
    {
      course: courseGroups[0]._id,
      title: "React JS Avancé",
      description: "Gestion d'état, hooks personnalisés et bonnes pratiques.",
      order: 1,
      estimatedHours: 12
    },
    {
      course: courseGroups[0]._id,
      title: "API Node.js & Authentification",
      description: "Création d'APIs sécurisées avec JWT et MongoDB.",
      order: 2,
      estimatedHours: 10
    },
    {
      course: courseGroups[1]._id,
      title: "Machine Learning Fondamentaux",
      description: "Notions de modèles, régularisation et évaluation.",
      order: 1,
      estimatedHours: 10
    }
  ]);

  const lessons = await Lesson.insertMany([
    {
      section: sections[0]._id,
      title: "Hooks et gestion d'état avancée",
      description: "Approfondir useReducer, useMemo, useCallback.",
      content: "Découvrez comment optimiser les performances et organiser un projet React.",
      order: 1,
      estimatedMinutes: 45
    },
    {
      section: sections[0]._id,
      title: "Architecture composants et accessibilité",
      description: "Structurer un parcours d'apprentissage efficace.",
      content: "Créer un dashboard responsive, des formulaires et des flux utilisateur.",
      order: 2,
      estimatedMinutes: 40
    },
    {
      section: sections[1]._id,
      title: "JWT, bcrypt et sécurité API",
      description: "Authentification token et bonnes pratiques server.",
      content: "Implémenter une API Node.js sécurisée avec Express et JWT.",
      order: 1,
      estimatedMinutes: 50
    }
  ]);

  await CourseMaterial.insertMany([
    {
      course: courseGroups[0]._id,
      section: sections[0]._id,
      lesson: lessons[0]._id,
      title: "Guide React avancé",
      description: "PDF de référence pour comprendre les hooks et le pattern container-presenter.",
      type: "pdf",
      url: "https://example.com/react-avance.pdf",
      createdBy: teacher._id
    },
    {
      course: courseGroups[1]._id,
      section: sections[2]._id,
      lesson: lessons[2]._id,
      title: "Cheat sheet ML",
      description: "Fiche synthétique des algorithmes supervisés.",
      type: "external",
      url: "https://example.com/ml-cheatsheet.pdf",
      createdBy: teacher._id
    }
  ]);

  await VideoResource.insertMany([
    {
      course: courseGroups[0]._id,
      section: sections[0]._id,
      lesson: lessons[0]._id,
      title: "React Hooks avancés (YouTube)",
      description: "Vidéo intégrée pour les hooks personnalisés.",
      embedUrl: "https://www.youtube.com/embed/dpw9EHDh2bM",
      createdBy: teacher._id
    },
    {
      course: courseGroups[1]._id,
      section: sections[2]._id,
      lesson: lessons[2]._id,
      title: "Introduction au Machine Learning",
      description: "Vidéo de présentation du parcours IA.",
      embedUrl: "https://www.youtube.com/embed/GwIo3gDZCVQ",
      createdBy: teacher._id
    }
  ]);

  const quiz = await Quiz.create({
    course: courseGroups[0]._id,
    section: sections[0]._id,
    lesson: lessons[0]._id,
    title: "Quiz React Hooks",
    description: "Évaluez vos connaissances sur les hooks réactifs.",
    durationMinutes: 15,
    maxScore: 10,
    published: true
  });

  const questions = await QuizQuestion.insertMany([
    {
      quiz: quiz._id,
      text: "Quel hook permet de mémoriser une valeur entre deux rendus ?",
      type: "single",
      options: [
        { text: "useEffect", isCorrect: false },
        { text: "useMemo", isCorrect: true },
        { text: "useState", isCorrect: false },
        { text: "useCallback", isCorrect: false }
      ],
      order: 1,
      score: 5
    },
    {
      quiz: quiz._id,
      text: "Parmi ces réponses, lesquelles sont vraies pour useCallback ?",
      type: "multiple",
      options: [
        { text: "Il mémorise une fonction", isCorrect: true },
        { text: "Il remplace useMemo", isCorrect: false },
        { text: "Il évite de recréer une fonction à chaque rendu", isCorrect: true },
        { text: "Il mutile l'état local", isCorrect: false }
      ],
      order: 2,
      score: 5
    }
  ]);

  quiz.questions = questions.map((item) => item._id);
  await quiz.save();

  await Announcement.create([
    {
      course: courseGroups[0]._id,
      title: "Bienvenue dans le parcours Full Stack",
      body: "Ce parcours va couvrir React avancé, API Node.js, et plus encore. Pensez à consulter les supports et les vidéos.",
      author: teacher._id,
      pinned: true
    },
    {
      classRoom: classRooms[1]._id,
      title: "Nouvelle séance Data IA",
      body: "La séance de Machine Learning aura lieu mercredi à 10h en ligne.",
      author: teacher._id
    }
  ]);

  await Message.create([
    {
      from: teacher._id,
      to: students[0]._id,
      course: courseGroups[0]._id,
      body: "Bonjour Sara, n'oublie pas de revoir les hooks avant la séance de demain."
    },
    {
      from: students[0]._id,
      to: teacher._id,
      course: courseGroups[0]._id,
      body: "Merci Professeur, je consulte le support et la vidéo."
    }
  ]);

  console.log("Seed completed");
  console.log("Admin:", admin.email, "Admin123!");
  console.log("Student:", students[0].email, "Student123!");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
