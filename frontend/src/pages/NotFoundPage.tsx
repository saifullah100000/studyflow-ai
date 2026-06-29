import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">
        Page not found
      </h2>
      <p className="mt-2 text-slate-600">
        The page you requested does not exist.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white"
      >
        Return to Dashboard
      </Link>
    </section>
  );
}