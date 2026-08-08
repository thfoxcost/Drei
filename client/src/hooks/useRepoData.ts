import { useQuery } from "@tanstack/react-query";
import type { RepoData } from "#/types/repo";

export function useRepoData(owner: string, repo: string, branch?: string) {
	return useQuery({
		queryKey: ["repo", owner, repo, branch],
		queryFn: async (): Promise<RepoData> => {
			const query = branch ? `?branch=${encodeURIComponent(branch)}` : "";
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}${query}`,
			);
			if (!res.ok) throw new Error("Failed to fetch repository");
			return res.json();
		},
		staleTime: 60_000,
	});
}
