import { useEffect, useState } from "react";
import { api } from "../services/api";

interface HealthResponse {
  status: "ok";
  service: string;
  environment: string;
  timestamp: string;
}

type ConnectionStatus = "checking" | "connected" | "disconnected";

export default function ApiStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkApi(): Promise<void> {
      try {
        const response = await api.get<HealthResponse>("/health");

        if (isMounted) {
          setHealth(response.data);
          setStatus("connected");
        }
      } catch {
        if (isMounted) {
          setHealth(null);
          setStatus("disconnected");
        }
      }
    }

    void checkApi();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          Checking backend connection...
        </p>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="font-medium text-red-700">Backend disconnected</p>
        <p className="mt-1 text-sm text-red-600">
          Make sure NestJS is running on port 3000.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
      <p className="font-medium text-green-700">Backend connected</p>
      <p className="mt-1 text-sm text-green-600">
        {health?.service} is running in {health?.environment} mode.
      </p>
    </div>
  );
}