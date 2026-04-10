import { useState } from "react";
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

export const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.10),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] px-3 py-3 sm:px-4 sm:py-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <Sidebar items={adminItems} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1">
          <Header title="Espace administrateur" onMenuOpen={() => setMobileMenuOpen(true)} />
          <div className="space-y-4 sm:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
