import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { needsPasswordSetup } from "@/pages/password/password-helper";
import { LanguageProvider } from "@/context/LanguageContext";

export default function AuthGuard() {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100svh">
        <Loader color="var(--green-500)" />
      </Center>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (needsPasswordSetup(user ?? session.user)) {
    return <Navigate to="/set-password" replace />;
  }

  return (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  );
}
