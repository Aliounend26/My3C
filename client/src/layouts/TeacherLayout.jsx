import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";

const teacherItems = [
  { to: "/teacher", label: "Dashboard", icon: "dashboard" },
  { to: "/teacher/courses", label: "Mes cours", icon: "courses" },
  { to: "/teacher/students", label: "Mes etudiants", icon: "students" },
  { to: "/teacher/sections", label: "Sections", icon: "library" },
  { to: "/teacher/lessons", label: "Lecons", icon: "book" },
  { to: "/teacher/resources", label: "Ressources", icon: "folder" },
  { to: "/teacher/quizzes", label: "Quiz", icon: "quiz" },
  { to: "/teacher/announcements", label: "Annonces", icon: "bell" },
  { to: "/teacher/messages", label: "Messages", icon: "reports" },
  { to: "/teacher/profile", label: "Mon profil", icon: "profile" }
];

export const TeacherLayout = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.12),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] p-4 lg:p-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
      <Sidebar items={teacherItems} />
      <main className="flex-1">
        <Header title="Espace formateur" />
        <Outlet />
      </main>
    </div>
  </div>
);
