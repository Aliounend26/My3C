import { useState } from "react";
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

export const TeacherLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.12),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] px-3 py-3 sm:px-4 sm:py-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <Sidebar items={teacherItems} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1">
          <Header title="Espace formateur" onMenuOpen={() => setMobileMenuOpen(true)} />
          <div className="space-y-4 sm:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
