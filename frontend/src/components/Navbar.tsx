import { Link } from "react-router";

export default function Navbar() {
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
        <Link
          to="/register"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Create account
        </Link>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
          S
        </div>
      </div>
    </header>
  );
}