import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { IssueFilters, IssuesList } from "#/types/issues";

export type { IssueFilters };

export function useIssues(
	owner: string,
	repo: string,
	filters: IssueFilters = {},
) {
	const params = new URLSearchParams();

	if (filters.state) params.set("state", filters.state);
	if (filters.author) params.set("author", filters.author);
	if (filters.assignee) params.set("assignee", filters.assignee);
	if (filters.search) params.set("search", filters.search);
	if (filters.sort && filters.sort !== "newest")
		params.set("sort", filters.sort);

	const queryString = params.toString();

	return useQuery({
		queryKey: [
			"issues",
			owner,
			repo,
			filters.state ?? "",
			filters.author ?? "",
			filters.assignee ?? "",
			filters.search ?? "",
			filters.sort ?? "newest",
		],
		queryFn: async (): Promise<IssuesList> => {
			const qs = queryString ? `?${queryString}` : "";
			const res = await fetch(
				`/api/repos/${owner}/${repo}/issues${qs}`,
			);
			if (!res.ok) throw new Error("Failed to fetch issues");
			return res.json();
		},
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
}
