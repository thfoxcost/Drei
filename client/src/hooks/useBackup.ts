import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";

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
		return new Error(apiErrorMessage(body) ?? fallback);
	} catch {
		return new Error(text || fallback);
	}
}

export function useBackupStatus(owner: string, repo: string) {
	return useQuery({
		queryKey: ["backup-status", owner, repo],
		queryFn: async (): Promise<BackupStatus> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/backup/status`,
				{ credentials: "include" },
			);
			if (!res.ok)
				throw await parseError(
					res,
					apiErrorMessage(null, {
						fallbackKey: "errors.client.fetchBackupStatus",
					}),
				);
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
				`http://localhost:3200/api/repos/${owner}/${repo}/backup`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ enabled }),
				},
			);
			if (!res.ok)
				throw await parseError(
					res,
					apiErrorMessage(null, {
						fallbackKey: "errors.client.updateBackupSetting",
					}),
				);
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
				`http://localhost:3200/api/repos/${owner}/${repo}/backup/run`,
				{ method: "POST", credentials: "include" },
			);
			if (!res.ok)
				throw await parseError(
					res,
					apiErrorMessage(null, { fallbackKey: "errors.client.createBackup" }),
				);
			return res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["backup-status", owner, repo],
			}),
	});
}
