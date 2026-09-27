import { useQuery } from "@tanstack/react-query";
import type { FileDiff } from "#/components/repo/commits/code-commit";

export interface FileChange {
	path: string;
	action: string;
}

export interface BranchCompare {
	ahead: number;
	behind: number;
	mergeBase: string;
	files: FileChange[];
	diffs: FileDiff[];
	mergeable: boolean;
	conflicts?: string[];
	remerge?: boolean;
}

export function usePullCompare(
	owner: string,
	repo: string,
	base: string,
	head: string,
) {
	return useQuery({
		queryKey: ["pull-compare", owner, repo, base, head],
		queryFn: async (): Promise<BranchCompare> => {
			const params = new URLSearchParams({ base, head });
			const res = await fetch(
				`/api/repos/${owner}/${repo}/pulls/compare?${params}`,
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.error ?? "Failed to compare branches");
			}
			return res.json();
		},
		enabled: !!owner && !!repo && !!base && !!head && base !== head,
		staleTime: 30_000,
	});
}
