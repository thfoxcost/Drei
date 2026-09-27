import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePRViewedFiles(
	owner: string,
	repo: string,
	number: number,
) {
	return useQuery({
		queryKey: ["pr-viewed", owner, repo, number],
		queryFn: async (): Promise<{ viewedFiles: string[] }> => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/pulls/${number}/viewed`,
				{ credentials: "include" },
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					body?.error ?? "Failed to fetch viewed files",
				);
			}
			return res.json();
		},
		enabled: !!owner && !!repo && !!number,
	});
}

export function useTogglePRViewedFile(
	owner: string,
	repo: string,
	number: number,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			viewed,
		}: {
			filePath: string;
			viewed: boolean;
		}) => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/pulls/${number}/viewed`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ filePath, viewed }),
				},
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					body?.error ?? "Failed to update viewed file",
				);
			}
			return res.json() as Promise<{ viewedFiles: string[] }>;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["pr-viewed", owner, repo, number],
				data,
			);
		},
	});
}
