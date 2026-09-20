import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PRFilters, PullRequestsList } from "#/types/prs";

export function useGlobalPulls(filters: PRFilters = {}) {
	const params = new URLSearchParams();

	if (filters.state) params.set("state", filters.state);
	if (filters.author) params.set("author", filters.author);
	if (filters.search) params.set("search", filters.search);
	if (filters.sort && filters.sort !== "newest")
		params.set("sort", filters.sort);

	const queryString = params.toString();

	return useQuery({
		queryKey: [
			"global-pulls",
			filters.state ?? "",
			filters.author ?? "",
			filters.search ?? "",
			filters.sort ?? "newest",
		],
		queryFn: async (): Promise<PullRequestsList> => {
			const qs = queryString ? `?${queryString}` : "";
			const res = await fetch(`http://localhost:3200/api/pulls${qs}`);
			if (!res.ok) throw new Error("Failed to fetch pull requests");
			return res.json();
		},
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
}
