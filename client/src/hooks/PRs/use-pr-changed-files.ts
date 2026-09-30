import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import type { BranchCompare } from "./use-pull-compare";

export function usePRChangedFiles(owner: string, repo: string, number: number) {
	return useQuery({
		queryKey: ["pr-files", owner, repo, number],
		queryFn: async (): Promise<BranchCompare> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/${number}/files`,
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(apiErrorMessage(body));
			}
			return res.json();
		},
		enabled: !!owner && !!repo && !!number,
		staleTime: 30_000,
	});
}
