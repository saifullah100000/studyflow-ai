import { useNavigate } from "react-router";
import { useAuth } from "../auth/auth-context";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout(): Promise<void> {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          StudyFlow AI
        </h1>

        <p className="text-xs text-slate-500">
          Intelligent study-note generation
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
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}