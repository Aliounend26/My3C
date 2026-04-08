import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";

const superAdminItems = [
  { to: "/superadmin", label: "Dashboard", icon: "dashboard" },
  { to: "/superadmin/users", label: "Tous les comptes", icon: "users" },
  { to: "/superadmin/admins", label: "Admins", icon: "users" },
  { to: "/superadmin/teachers", label: "Formateurs", icon: "users" },
  { to: "/superadmin/students", label: "Etudiants", icon: "students" },
  { to: "/superadmin/formations", label: "Formations", icon: "formations" },
  { to: "/superadmin/classes", label: "Classes", icon: "classes" },
  { to: "/superadmin/courses", label: "Cours", icon: "courses" },
  { to: "/superadmin/attendances", label: "Presences", icon: "attendances" },
  { to: "/superadmin/content", label: "Contenus", icon: "folder" },
  { to: "/superadmin/statistics", label: "Statistiques", icon: "reports" },
  { to: "/superadmin/profile", label: "Mon profil", icon: "profile" }
];

export const SuperAdminLayout = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] p-4 lg:p-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
      <Sidebar items={superAdminItems} />
      <main className="flex-1">
        <Header title="Espace SuperAdmin" />
        <Outlet />
      </main>
    </div>
  </div>
);
