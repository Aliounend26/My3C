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

export const StudentLayout = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] p-4 lg:p-6">
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <Sidebar items={studentItems} />
      <main className="flex-1">
        <Header title="Espace etudiant" />
        <Outlet />
      </main>
    </div>
  </div>
);
