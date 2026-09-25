import type { HeatmapDatum } from "#/components/heatmap-calendar.tsx";

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
	const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/${encodeURIComponent(username)}/contributions?year=${year}`;

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
		throw new Error(`Failed to load contributions (${res.status})`);
	}

	return res.json();
}
