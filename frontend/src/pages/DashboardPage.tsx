import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/auth-context";
import { api } from "../services/api";

interface DashboardStats {
  totalNotes: number;
  completedGenerations: number;
  failedGenerations: number;
  whatsappDeliveries: number;
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: string;
  iconClasses: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconClasses,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat().format(value)}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold ${iconClasses}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Loading dashboard statistics"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between">
            <div className="space-y-4">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-9 w-16 rounded bg-slate-200" />
            </div>

            <div className="h-12 w-12 rounded-xl bg-slate-200" />
          </div>

          <div className="mt-5 h-4 w-40 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    api
      .get<DashboardStats>("/dashboard/stats", {
        signal: controller.signal,
      })
      .then((response) => {
        if (isActive) {
          setStats(response.data);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (
          axios.isAxiosError(error) &&
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          void refreshUser();
          return;
        }

        setErrorMessage(
          "Dashboard statistics could not be loaded.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [refreshUser]);

  async function handleRetry(): Promise<void> {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response =
        await api.get<DashboardStats>("/dashboard/stats");

      setStats(response.data);
    } catch (error: unknown) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        await refreshUser();
        return;
      }

      setErrorMessage(
        "Dashboard statistics could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Student dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Welcome back, {user?.name}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Review your generated study material and delivery activity.
        </p>
      </div>

      {isLoading && <DashboardLoadingSkeleton />}

      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <p className="font-medium text-red-800">
            Unable to load dashboard
          </p>

          <p className="mt-1 text-sm text-red-700">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => void handleRetry()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && stats && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total notes"
            value={stats.totalNotes}
            description="Notes saved in your StudyFlow account"
            icon="N"
            iconClasses="bg-indigo-100 text-indigo-700"
          />

          <StatCard
            title="Completed generations"
            value={stats.completedGenerations}
            description="AI generation jobs completed successfully"
            icon="✓"
            iconClasses="bg-green-100 text-green-700"
          />

          <StatCard
            title="Failed generations"
            value={stats.failedGenerations}
            description="Generation jobs that require another attempt"
            icon="!"
            iconClasses="bg-red-100 text-red-700"
          />

          <StatCard
            title="WhatsApp deliveries"
            value={stats.whatsappDeliveries}
            description="Study materials delivered through WhatsApp"
            icon="W"
            iconClasses="bg-emerald-100 text-emerald-700"
          />
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Generate study material
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create organized notes from a topic, document or study
            prompt.
          </p>

          <Link
            to="/generate"
            className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Start generating
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Review saved notes
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Open your saved notes and continue studying from where you
            stopped.
          </p>

          <Link
            to="/notes"
            className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            View notes
          </Link>
        </article>
      </div>
    </section>
  );
}