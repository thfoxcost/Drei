import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import type { TagInfo } from "#/types/repo";

async function fetchJSON<T>(url: string, fallback: string): Promise<T> {
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		let message = "";
		try {
			const body = JSON.parse(text);
			message = body?.error ?? body?.message ?? "";
		} catch {
			message = text;
		}
		throw new Error(message || fallback);
	}
	return res.json();
}

export function useTags(owner: string, repo: string) {
	return useQuery({
		queryKey: ["tags", owner, repo],
		queryFn: (): Promise<TagInfo[]> =>
			fetchJSON<TagInfo[] | null>(
				`http://localhost:3200/api/repos/${owner}/${repo}/tags`,
				apiErrorMessage(null, { fallbackKey: "errors.client.fetchTags" }),
			).then((data) => data ?? []),
		enabled: !!(owner && repo),
		staleTime: 60_000,
	});
}

export function useTag(owner: string, repo: string, tag: string) {
	return useQuery({
		queryKey: ["tag", owner, repo, tag],
		queryFn: (): Promise<TagInfo> =>
			fetchJSON<TagInfo>(
				`http://localhost:3200/api/repos/${owner}/${repo}/tags/${encodeURIComponent(tag)}`,
				apiErrorMessage(null, { fallbackKey: "errors.client.fetchTag" }),
			),
		enabled: !!(owner && repo && tag),
		staleTime: 60_000,
	});
}
