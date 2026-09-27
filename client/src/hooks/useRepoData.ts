import { useQuery } from "@tanstack/react-query";
import type { RepoData } from "#/types/repo";

export function useRepoData(owner: string, repo: string, branch?: string) {
	return useQuery({
		queryKey: ["repo", owner, repo, branch],
		queryFn: async (): Promise<RepoData> => {
			const query = branch ? `?ref=${encodeURIComponent(branch)}` : "";
			const res = await fetch(
				`/api/repos/${owner}/${repo}${query}`,
				{ credentials: "include" },
			);
			if (!res.ok) {
				// The backend reports failures as plain text (http.Error) or
				// JSON ({error}); surface the real message instead of a
				// generic one so error states are diagnosable.
				const text = await res.text().catch(() => "");
				let message = "";
				try {
					const body = JSON.parse(text);
					message = body?.error ?? body?.message ?? "";
				} catch {
					message = text;
				}
				throw new Error(message || "Failed to fetch repository");
			}
			return res.json();
		},
		staleTime: 60_000,
		// Self-healing for freshly created repositories: keep polling every
		// 5 seconds while the repo has no commits (e.g. the user just pushed
		// the first commit from the NoRepo instructions). Polling stops
		// automatically once hasCommits becomes true.
		refetchInterval: (query) =>
			query.state.data?.hasCommits ? false : 5_000,
	});
}
