import { useQuery } from "@tanstack/react-query";
import { authClient } from "#/lib/auth-client.ts";

export type ServiceState = "online" | "degraded" | "offline" | "unavailable";

export interface ServiceStatus {
	name: string;
	status: ServiceState;
	latency: number;
}

export interface HealthData {
	services: ServiceStatus[];
	/** False for anonymous callers, who receive no host metrics. */
	metricsAvailable: boolean;
	system: SystemMetrics | null;
	/** The client server's own memory usage, or null if it could not be read. */
	client: ClientProcess | null;
	/** Storage used by the signed-in account, or null if it could not be measured. */
	storage: StorageUsage | null;
}

export interface ClientProcess {
	rssBytes: number;
	heapUsedBytes: number;
	heapTotalBytes: number;
}

export interface StorageUsage {
	bytes: number;
	computedAt: string;
}

export interface SystemMetrics {
	uptime: string;
	hostUptime: string;
	version: string;
	environment: string;
	cpu: {
		percent: number;
		count: number;
	};
	processMemory: {
		rss: number;
		heap: number;
		unit: string;
		goroutines: number;
	};
	lastUpdated: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function useHealth(pollIntervalMs = 15000) {
	const { data: session, isPending: sessionPending } = authClient.useSession();

	const query = useQuery({
		queryKey: ["health", session?.user?.id ?? null],
		queryFn: async (): Promise<HealthData> => {
			// no-store: host metrics are gated on the session cookie, so a
			// cached response must never be served to a different user.
			const res = await fetch(`${BACKEND_URL}/api/status`, {
				credentials: "include",
				cache: "no-store",
			});

			if (!res.ok) {
				throw new Error(`Health check failed: ${res.status}`);
			}

			return res.json();
		},
		enabled: !sessionPending && session !== null,
		refetchInterval: pollIntervalMs,
		staleTime: pollIntervalMs,
	});

	return { ...query, sessionPending };
}
