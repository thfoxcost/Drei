import { useQuery } from "@tanstack/react-query";
import { usePeople } from "#/hooks/usePeople";
import type { Repo } from "#/hooks/useUserRepos";
import { backendUrl } from "#/lib/backend-url";

async function fetchOwnerRepos(owner: string): Promise<Repo[]> {
	const res = await fetch(
		`${backendUrl()}/api/users/${encodeURIComponent(owner)}/repos`,
	);
	if (!res.ok) return [];
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}

/**
 * Every public repository across all users, aggregated from the existing
 * per-owner endpoint. Private repositories are never shown, even the
 * viewer's own — this view is public-only.
 */
export function useAllRepos() {
	const { data: people = [] } = usePeople();

	const owners = [
		...new Set(people.map((p) => p.username).filter((n) => n.trim() !== "")),
	].sort((a, b) => a.localeCompare(b));

	return useQuery({
		queryKey: ["all-repos", owners],
		queryFn: async (): Promise<Repo[]> => {
			const perOwner = await Promise.all(owners.map(fetchOwnerRepos));
			const seen = new Set<string>();
			const all: Repo[] = [];

			for (const repos of perOwner) {
				for (const repo of repos) {
					const key = `${repo.owner.toLowerCase()}/${repo.name.toLowerCase()}`;
					if (seen.has(key)) continue;
					seen.add(key);

					if (!repo.visibility) continue;
					all.push(repo);
				}
			}

			return all.sort((a, b) =>
				(b.lastUpdatedAt ?? b.lastUpdated ?? "").localeCompare(
					a.lastUpdatedAt ?? a.lastUpdated ?? "",
				),
			);
		},
		enabled: owners.length > 0,
		staleTime: 30_000,
	});
}
