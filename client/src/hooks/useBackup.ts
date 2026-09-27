import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface BackupStatus {
	success: boolean;
	enabled: boolean;
	isLatest: boolean;
	lastBackupAt: string;
	commitHash: string;
	size: number;
}

async function parseError(res: Response, fallback: string): Promise<Error> {
	const text = await res.text().catch(() => "");
	try {
		const body = JSON.parse(text);
		return new Error(body?.error ?? body?.message ?? fallback);
	} catch {
		return new Error(text || fallback);
	}
}

export function useBackupStatus(owner: string, repo: string) {
	return useQuery({
		queryKey: ["backup-status", owner, repo],
		queryFn: async (): Promise<BackupStatus> => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/backup/status`,
				{ credentials: "include" },
			);
			if (!res.ok) throw await parseError(res, "Failed to fetch backup status");
			return res.json();
		},
		staleTime: 15_000,
	});
}

export function useToggleBackup(owner: string, repo: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (enabled: boolean): Promise<BackupStatus> => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/backup`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ enabled }),
				},
			);
			if (!res.ok)
				throw await parseError(res, "Failed to update backup setting");
			return res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["backup-status", owner, repo],
			}),
	});
}

export function useRunBackup(owner: string, repo: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (): Promise<BackupStatus> => {
			const res = await fetch(
				`/api/repos/${owner}/${repo}/backup/run`,
				{ method: "POST", credentials: "include" },
			);
			if (!res.ok) throw await parseError(res, "Failed to create backup");
			return res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["backup-status", owner, repo],
			}),
	});
}
