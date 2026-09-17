import { useQuery } from "@tanstack/react-query";
import type { PullRequest } from "#/types/prs";

export function usePullRequest(owner: string, repo: string, number: number) {
	return useQuery({
		queryKey: ["pull", owner, repo, number],
		queryFn: async (): Promise<PullRequest> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/${number}`,
			);
			if (!res.ok) throw new Error("Failed to fetch pull request");
			return res.json();
		},
		staleTime: 10_000,
	});
}
