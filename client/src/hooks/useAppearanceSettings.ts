import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import { backendUrl } from "#/lib/backend-url";

export interface AppearanceSettings {
	theme: "light" | "dark" | "system";
	language: string;
	heatmapProfileColor: boolean;
	todosEnabled: boolean;
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

export function useAppearanceSettings() {
	return useQuery({
		queryKey: ["appearance"],
		queryFn: async (): Promise<AppearanceSettings> => {
			const res = await fetch(`${backendUrl()}/api/user/appearance`, {
				credentials: "include",
			});

			if (!res.ok) {
				throw await parseError(
					res,
					apiErrorMessage(null, {
						fallbackKey: "errors.client.fetchAppearance",
					}),
				);
			}

			return res.json();
		},
		staleTime: 60_000,
	});
}

/**
 * Whether the built-in to-do list is enabled. Defaults to true so the header
 * button appears before (or without) a successful settings fetch.
 */
export function useTodosEnabled(): boolean {
	const { data } = useAppearanceSettings();

	return data?.todosEnabled !== false;
}

export function useUpdateAppearance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (changes: Partial<AppearanceSettings>) => {
			const res = await fetch(`${backendUrl()}/api/user/appearance`, {
				method: "PUT",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(changes),
			});

			if (!res.ok) {
				throw await parseError(
					res,
					apiErrorMessage(null, {
						fallbackKey: "errors.client.saveAppearance",
					}),
				);
			}

			return res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["appearance"] }),
	});
}
