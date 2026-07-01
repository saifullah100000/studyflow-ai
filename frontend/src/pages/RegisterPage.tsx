import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { api } from "../services/api";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: string;
  };
}

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const [formData, setFormData] =
    useState<RegisterFormData>(initialFormData);

  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof RegisterFormData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setErrors([]);
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrors(["Password and confirmation password do not match"]);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<RegisterResponse>("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccessMessage(response.data.message);
      setFormData(initialFormData);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const message = error.response?.data?.message;

        if (Array.isArray(message)) {
          setErrors(message);
        } else if (typeof message === "string") {
          setErrors([message]);
        } else if (!error.response) {
          setErrors([
            "Unable to connect to the backend. Make sure NestJS is running.",
          ]);
        } else {
          setErrors(["Registration failed. Please try again."]);
        }
      } else {
        setErrors(["An unexpected error occurred"]);
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
              Create smarter study material with artificial intelligence.
            </h1>

            <p className="mt-5 text-indigo-100">
              Generate structured notes, quizzes, flashcards and PDF documents
              from any topic.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            Learn more efficiently. Revise more effectively.
          </p>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">
              CREATE ACCOUNT
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Join StudyFlow AI
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your details to create your student account.
            </p>
          </div>

          {errors.length > 0 && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <p className="font-medium text-red-800">
                Please fix the following:
              </p>

              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
            >
              {successMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Enter your full name"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
            </div>

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
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
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
                autoComplete="new-password"
                value={formData.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="At least 8 characters"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use uppercase, lowercase and at least one number.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                placeholder="Enter your password again"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
  Already have an account?{" "}
  <Link
    to="/login"
    className="font-medium text-indigo-600 hover:text-indigo-700"
  >
    Sign in
  </Link>
</p>

          <p className="mt-3 text-center">
            <Link
              to="/"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Return to dashboard
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}