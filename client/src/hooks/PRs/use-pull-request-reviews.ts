import { useQuery } from "@tanstack/react-query";
import type { PullRequestReview } from "#/types/prs";

interface PullRequestReviewsResponse {
	reviews: PullRequestReview[];
}

export function usePullRequestReviews(
	owner: string,
	repo: string,
	number: number,
) {
	return useQuery({
		queryKey: ["pull-reviews", owner, repo, number],
		queryFn: async (): Promise<PullRequestReviewsResponse> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/${number}/reviews`,
			);
			if (!res.ok) throw new Error("Failed to fetch pull request reviews");
			return res.json();
		},
		staleTime: 10_000,
	});
}
