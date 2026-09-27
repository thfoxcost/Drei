import { useQuery } from "@tanstack/react-query";

interface DuplicateCheck {
	duplicate: boolean;
	number: number | null;
}

export function useDuplicatePR(
	owner: string,
	repo: string,
	source: string,
	target: string,
) {
	return useQuery({
		queryKey: ["pull-duplicate", owner, repo, source, target],
		queryFn: async (): Promise<DuplicateCheck> => {
			const params = new URLSearchParams({ source, target });
			const res = await fetch(
				`/api/repos/${owner}/${repo}/pulls/duplicate?${params}`,
			);
			if (!res.ok) throw new Error("Failed to check for duplicate PR");
			return res.json();
		},
		enabled: !!owner && !!repo && !!source && !!target && source !== target,
		staleTime: 10_000,
	});
}
