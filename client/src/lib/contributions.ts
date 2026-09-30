import type { HeatmapDatum } from "#/components/heatmap-calendar.tsx";
import { i18n } from "#/i18n/i18n";

export type ContributionBreakdown = {
	commits: number;
	issues: number;
	pullRequests: number;
};

export type ContributionsResponse = {
	username: string;
	year: number;
	total: number;
	breakdown: ContributionBreakdown;
	contributions: HeatmapDatum[];
};

export async function getContributions(
	username: string,
	year: number,
): Promise<ContributionsResponse> {
	const base =
		(import.meta.env.VITE_BACKEND_URL as string | undefined) ||
		"http://localhost:3200";
	const url = `${base}/api/users/${encodeURIComponent(username)}/contributions?year=${year}`;

	const res = await fetch(url, { credentials: "include" });

	if (res.status === 404) {
		return {
			username,
			year,
			total: 0,
			breakdown: { commits: 0, issues: 0, pullRequests: 0 },
			contributions: [],
		};
	}

	if (!res.ok) {
		throw new Error(
			`${i18n.t("errors.client.fetchContributions") as string} (${res.status})`,
		);
	}

	const contentType = res.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		const text = await res.text();
		throw new Error(
			`${i18n.t("errors.client.fetchContributions") as string}: expected JSON but got ${contentType || "unknown content-type"} (body: ${text.slice(0, 120) || "<empty>"})`,
		);
	}

	return res.json();
}
