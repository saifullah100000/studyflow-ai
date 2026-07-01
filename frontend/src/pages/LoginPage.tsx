import axios from "axios";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/auth-context";

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [isLoading, navigate, user]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const message = error.response?.data?.message;

        if (Array.isArray(message)) {
          setErrorMessage(message.join(". "));
        } else if (typeof message === "string") {
          setErrorMessage(message);
        } else if (!error.response) {
          setErrorMessage(
            "Unable to connect to the backend. Make sure NestJS is running.",
          );
        } else {
          setErrorMessage("Login failed. Please try again.");
        }
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        <section className="hidden bg-indigo-700 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-2xl font-bold">StudyFlow AI</p>

            <h1 className="mt-16 text-4xl font-bold leading-tight">
              Continue your smarter learning journey.
            </h1>

            <p className="mt-5 text-indigo-100">
              Sign in to access your notes, quizzes, flashcards,
              generation history and study dashboard.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            Learn more efficiently. Revise more effectively.
          </p>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Sign in to StudyFlow AI
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your registered email and password.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}