import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error"

export function useDeleteSourceBranch(
	owner: string,
	repo: string,
	number: number,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (): Promise<{ success: boolean }> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/${number}/source-branch`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					apiErrorMessage(body),
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["pull", owner, repo, number],
			});
		},
	});
}
