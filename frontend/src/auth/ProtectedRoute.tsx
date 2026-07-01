import { Navigate, Outlet } from "react-router";
import { useAuth } from "./auth-context";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm font-medium text-slate-600">
          Checking authentication...
        </p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}