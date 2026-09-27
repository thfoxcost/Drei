import { useQuery } from "@tanstack/react-query";
import type { FileDiff } from "#/components/repo/commits/code-commit";

export interface CommitDetail {
	fullHash: string;
	shortHash: string;
	message: string;
	body: string;
	branch: string;
	parentCount: number;
	parentHashes: string[];
	date: string;
	authorName: string;
	authorAvatar: string;
	changedFiles: number;
	additions: number;
	deletions: number;
	files: { path: string; action: string }[];
	diffs: FileDiff[];
}

export function useCommitDetail(
	owner: string,
	repo: string,
	hash: string,
) {
	return useQuery({
		queryKey: ["commit-detail", owner, repo, hash],
		queryFn: async (): Promise<CommitDetail> => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/commits/${hash}`,
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					body?.error ?? "Failed to fetch commit details",
				);
			}
			return res.json();
		},
		enabled: !!owner && !!repo && !!hash,
		staleTime: 60_000,
	});
}
