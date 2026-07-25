import { useEffect, useState } from "react";

export type ServiceState = "online" | "degraded" | "offline";

export interface ServiceStatus {
  name: string;
  status: ServiceState;
  latency: number;
}

export interface HealthData {
  services: ServiceStatus[];
  system: {
    uptime: string;
    version: string;
    environment: string;
    cpu: number;
    memory: { used: number; total: number; unit: string };
    disk: { used: number; total: number; unit: string };
    requests: number;
    averageLatency: number;
    lastDeploy: string;
    lastUpdated: string;
  };
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function useHealth(pollIntervalMs = 15000) {
  const [data, setData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/status`);
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        const json = (await res.json()) as HealthData;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return { data, isLoading, error };
}