import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";

export default function AuthGuard() {
  const { session, loading } = useAuth();

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

  return <Outlet />;
}
