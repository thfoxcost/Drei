import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";

export interface MergeabilityResult {
	mergeable: boolean;
	conflicts: string[];
	state?: string;
	error?: string;
}

export function usePullRequestMergeability(
	owner: string,
	repo: string,
	number: number,
	state: string,
) {
	return useQuery({
		queryKey: ["pr-mergeability", owner, repo, number],
		queryFn: async (): Promise<MergeabilityResult> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/${number}/mergeability`,
			);
			if (!res.ok)
				throw new Error(
					apiErrorMessage(null, {
						fallbackKey: "errors.client.checkMergeability",
					}),
				);
			return res.json();
		},
		staleTime: 15_000,
		enabled: state === "open",
	});
}
