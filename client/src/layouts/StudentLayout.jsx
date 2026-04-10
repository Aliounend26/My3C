import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";

const studentItems = [
  { to: "/student", label: "Dashboard", icon: "dashboard" },
  { to: "/student/courses", label: "Mes cours", icon: "mycourses" },
  { to: "/student/messages", label: "Messages", icon: "bell" },
  { to: "/student/quiz-results", label: "Quiz & notes", icon: "quiz" },
  { to: "/student/attendances", label: "Mes presences", icon: "myattendances" },
  { to: "/student/scanner", label: "Scanner QR", icon: "scanner" },
  { to: "/student/progress", label: "Progression", icon: "progress" },
  { to: "/student/calendar", label: "Calendrier", icon: "calendar" },
  { to: "/student/profile", label: "Mon profil", icon: "profile" }
];

export const StudentLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] px-3 py-3 sm:px-4 sm:py-4 lg:p-6">
      <div className="flex w-full gap-6">
        <Sidebar items={studentItems} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1">
          <Header title="Espace etudiant" onMenuOpen={() => setMobileMenuOpen(true)} />
          <div className="space-y-4 sm:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
