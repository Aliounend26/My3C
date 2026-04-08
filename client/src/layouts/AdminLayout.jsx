import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";

const adminItems = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/users", label: "Utilisateurs", icon: "users" },
  { to: "/admin/teachers", label: "Formateurs", icon: "users" },
  { to: "/admin/formations", label: "Formations", icon: "formations" },
  { to: "/admin/classes", label: "Classes", icon: "classes" },
  { to: "/admin/students", label: "Etudiants", icon: "students" },
  { to: "/admin/courses", label: "Cours", icon: "courses" },
  { to: "/admin/sections", label: "Sections", icon: "book" },
  { to: "/admin/calendar", label: "Calendrier", icon: "calendar" },
  { to: "/admin/attendances", label: "Presences", icon: "attendances" },
  { to: "/admin/qr-codes", label: "QR Codes", icon: "qr" },
  { to: "/admin/reports", label: "Statistiques", icon: "reports" },
  { to: "/admin/profile", label: "Mon profil", icon: "profile" }
];

export const AdminLayout = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.10),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] p-4 lg:p-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
      <Sidebar items={adminItems} />
      <main className="flex-1">
        <Header title="Espace administrateur" />
        <Outlet />
      </main>
    </div>
  </div>
);
