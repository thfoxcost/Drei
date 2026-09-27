import { useQuery } from "@tanstack/react-query";
import type { PullRequestEvent } from "#/types/prs";

interface PullRequestEventsResponse {
	events: PullRequestEvent[];
}

export function usePullRequestEvents(
	owner: string,
	repo: string,
	number: number,
) {
	return useQuery({
		queryKey: ["pull-events", owner, repo, number],
		queryFn: async (): Promise<PullRequestEventsResponse> => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/pulls/${number}/events`,
			);
			if (!res.ok) throw new Error("Failed to fetch pull request events");
			return res.json();
		},
		staleTime: 10_000,
	});
}
