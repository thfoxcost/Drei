import { useQuery } from "@tanstack/react-query";

import { i18n } from "#/i18n/i18n";

const API = "http://localhost:3200";

async function fetchJSON<T>(url: string): Promise<T> {
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			text || `${i18n.t("errors.client.fetchInsights") as string}: ${url}`,
		);
	}
	return res.json();
}

export interface PulseStats {
	authors: number;
	commits: number;
	filesChanged: number;
	additions: number;
	deletions: number;
	defaultBranch: string;
	start: string;
	end: string;
}

export function usePulse(
	owner: string,
	repo: string,
	days = 7,
	branch?: string,
) {
	const params = new URLSearchParams();
	params.set("days", String(days));
	if (branch) params.set("ref", branch);
	return useQuery({
		queryKey: ["insights", "pulse", owner, repo, days, branch ?? ""],
		queryFn: () =>
			fetchJSON<PulseStats>(
				`${API}/api/repos/${owner}/${repo}/insights/pulse?${params.toString()}`,
			),
		staleTime: 60_000,
	});
}

export interface InsightDaily {
	date: string;
	commits: number;
}

export interface InsightContributor {
	username: string;
	avatar: string | null;
	initials: string;
	commits: number;
	additions: number;
	deletions: number;
	rank: number;
	daily: InsightDaily[];
}

export interface ContributorsInsight {
	contributors: InsightContributor[];
	daily: InsightDaily[];
}

export function useInsightContributors(
	owner: string,
	repo: string,
	branch?: string,
) {
	const params = new URLSearchParams();
	if (branch) params.set("ref", branch);
	const qs = params.toString();
	return useQuery({
		queryKey: ["insights", "contributors", owner, repo, branch ?? ""],
		queryFn: () =>
			fetchJSON<ContributorsInsight>(
				`${API}/api/repos/${owner}/${repo}/insights/contributors${qs ? `?${qs}` : ""}`,
			),
		staleTime: 60_000,
	});
}

export interface CodeFrequencyWeek {
	week: string;
	additions: number;
	deletions: number;
}

export function useCodeFrequency(owner: string, repo: string, branch?: string) {
	const params = new URLSearchParams();
	if (branch) params.set("ref", branch);
	const qs = params.toString();
	return useQuery({
		queryKey: ["insights", "code-frequency", owner, repo, branch ?? ""],
		queryFn: async () => {
			const data = await fetchJSON<{ weeks: CodeFrequencyWeek[] }>(
				`${API}/api/repos/${owner}/${repo}/insights/code-frequency${qs ? `?${qs}` : ""}`,
			);
			return data.weeks ?? [];
		},
		staleTime: 60_000,
	});
}
