import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "../types";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-loading" aria-live="polite">
        <div className="brand-mark large">M</div>
        <p>Opening your secure workspace...</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/dashboard" : "/donor-portal"} replace />;
  }
  return <Outlet />;
}
