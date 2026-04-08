import { Navigate, Outlet } from "react-router-dom";
import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader label="Vérification de la session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "superadmin") return <Navigate to="/superadmin" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "teacher") return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};
