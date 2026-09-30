import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";

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
				`http://localhost:3200/api/repos/${owner}/${repo}/pulls/duplicate?${params}`,
			);
			if (!res.ok)
				throw new Error(
					apiErrorMessage(null, {
						fallbackKey: "errors.client.checkDuplicatePr",
					}),
				);
			return res.json();
		},
		enabled: !!owner && !!repo && !!source && !!target && source !== target,
		staleTime: 10_000,
	});
}
