import { useQuery } from "@tanstack/react-query";
import type { BlobData } from "#/types/repo";

export function useBlob(owner: string, repo: string, branch: string, path: string) {
	return useQuery({
		queryKey: ["blob", owner, repo, branch, path],
		queryFn: async (): Promise<BlobData> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/blob/${encodeURIComponent(branch)}/${path}`,
			);
			if (!res.ok) throw new Error("Failed to fetch file");
			return res.json();
		},
		enabled: !!(owner && repo && branch && path),
		staleTime: 60_000,
	});
}
