import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/auth-context";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  const userInitial =
    user?.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-indigo-700 lg:hidden">
            StudyFlow AI
          </p>

          <p className="hidden text-sm text-slate-500 sm:block lg:block">
            Welcome back,{" "}
            <span className="font-medium text-slate-800">
              {user?.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">
              {user?.name}
            </p>

            <p className="text-xs text-slate-500">
              {user?.email}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
            {userInitial}
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}