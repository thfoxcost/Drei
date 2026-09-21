import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	OrganizationCreateRequest,
	OrganizationDetail,
	OrganizationListItem,
} from "#/types/organization";

export function useUserOrganizations() {
	return useQuery({
		queryKey: ["organizations"],
		queryFn: async (): Promise<OrganizationListItem[]> => {
			const res = await fetch("http://localhost:3200/api/orgs", {
				credentials: "include",
			});
			if (!res.ok) throw new Error("Failed to fetch organizations");
			const data = await res.json();
			return data.organizations ?? [];
		},
		staleTime: 30_000,
	});
}

export function useOrganization(slug: string) {
	return useQuery({
		queryKey: ["organization", slug],
		queryFn: async (): Promise<OrganizationDetail> => {
			const res = await fetch(
				`http://localhost:3200/api/orgs/${encodeURIComponent(slug)}`,
				{ credentials: "include" },
			);
			if (!res.ok) throw new Error("Failed to fetch organization");
			return res.json();
		},
		enabled: !!slug,
		staleTime: 30_000,
	});
}

export function useCreateOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			params: OrganizationCreateRequest,
		): Promise<OrganizationDetail> => {
			const res = await fetch("http://localhost:3200/api/orgs", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.error ?? "Failed to create organization");
			}
			const data = await res.json();
			return data.organization;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
		},
	});
}

export function useCheckSlug(slug: string) {
	return useQuery({
		queryKey: ["org-slug-check", slug],
		queryFn: async (): Promise<{ available: boolean }> => {
			const res = await fetch(
				`http://localhost:3200/api/orgs?slug=${encodeURIComponent(slug)}`,
			);
			if (!res.ok) throw new Error("Failed to check slug");
			return res.json();
		},
		enabled: slug.length >= 2,
		staleTime: 5_000,
	});
}
