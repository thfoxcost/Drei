import { useQuery } from "@tanstack/react-query";
import type { Commit } from "#/types/repo";

export function usePRCommits(
	owner: string,
	repo: string,
	base: string,
	head: string,
	mergeCommitHash?: string | null,
) {
	return useQuery({
		queryKey: ["pr-commits", owner, repo, base, head, mergeCommitHash ?? ""],
		queryFn: async (): Promise<Commit[]> => {
			const params = new URLSearchParams({ base, head });
			if (mergeCommitHash) params.set("mergeCommit", mergeCommitHash);
			const res = await fetch(
				`/api/repos/${owner}/${repo}/pulls/compare/commits?${params}`,
			);
			if (!res.ok) throw new Error("Failed to fetch commits");
			return res.json();
		},
		enabled: !!owner && !!repo && !!base && !!head && base !== head,
		staleTime: 30_000,
	});
}
