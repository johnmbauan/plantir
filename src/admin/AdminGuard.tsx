import { Navigate, Outlet } from "react-router-dom";
import { DASHBOARD_PATH } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard() {
  const { session } = useAuth();
  const isAdmin = session?.user.app_metadata?.role === "admin";

  if (!isAdmin) {
    return <Navigate to={DASHBOARD_PATH} replace />;
  }

  return <Outlet />;
}
