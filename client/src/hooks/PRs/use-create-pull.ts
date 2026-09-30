import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import type { PullRequest } from "#/types/prs";

interface CreatePullRequestParams {
	title: string;
	description: string;
	sourceBranch: string;
	targetBranch: string;
	labels?: string[];
	assignees?: string[];
	reviewers?: string[];
}

export function useCreatePullRequest(owner: string, repo: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: CreatePullRequestParams,
		): Promise<PullRequest> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(params),
				},
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(apiErrorMessage(body));
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["pulls", owner, repo],
			});
		},
	});
}
