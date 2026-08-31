import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_PATH } from "@/constants/routes";
import { needsPasswordSetup } from "@/pages/password/password-helper";
import LandingMain from "./landing/LandingMain";
import styles from "./landing/LandingPage.module.css";

export default function LandingPage() {
  const { session, user, loading } = useAuth();
  const authUser = user ?? session?.user;

  if (loading) return null;

  if (session) {
    if (needsPasswordSetup(authUser)) {
      return <Navigate to="/set-password" replace />;
    }
    return <Navigate to={DASHBOARD_PATH} replace />;
  }

  return (
    <div className={styles.page}>
      <LandingMain />
    </div>
  );
}
