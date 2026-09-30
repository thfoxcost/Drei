import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import type { IssueFilters, IssuesList } from "#/types/issues";

export function useGlobalIssues(filters: IssueFilters = {}) {
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
			"global-issues",
			filters.state ?? "",
			filters.author ?? "",
			filters.assignee ?? "",
			filters.search ?? "",
			filters.sort ?? "newest",
		],
		queryFn: async (): Promise<IssuesList> => {
			const qs = queryString ? `?${queryString}` : "";
			const res = await fetch(`http://localhost:3200/api/issues${qs}`);
			if (!res.ok)
				throw new Error(
					apiErrorMessage(null, { fallbackKey: "errors.client.fetchIssues" }),
				);
			return res.json();
		},
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
}
