import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMergePullRequest(
	owner: string,
	repo: string,
	number: number,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (): Promise<{ mergeCommitHash: string }> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/${number}/merge`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.error ?? "Failed to merge pull request");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["pull", owner, repo, number],
			});
			queryClient.invalidateQueries({
				queryKey: ["pull-events", owner, repo, number],
			});
			queryClient.invalidateQueries({
				queryKey: ["pr-mergeability", owner, repo, number],
			});
			queryClient.invalidateQueries({
				queryKey: ["pulls", owner, repo],
			});
		},
	});
}
