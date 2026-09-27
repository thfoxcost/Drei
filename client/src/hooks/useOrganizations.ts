import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOrganizationRepoRequest,
  OrganizationCreateRequest,
  OrganizationDetail,
  OrganizationLanguage,
  OrganizationListItem,
  OrganizationMember,
  OrganizationRepo,
  OrganizationUpdateRequest,
} from "#/types/organization";

export function useUserOrganizations() {
	return useQuery({
		queryKey: ["organizations"],
		queryFn: async (): Promise<OrganizationListItem[]> => {
			const res = await fetch("/api/orgs", {
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
				`/api/orgs/${encodeURIComponent(slug)}`,
				{ credentials: "include" },
			);
			if (!res.ok) throw new Error("Failed to fetch organization");
			return res.json();
		},
		enabled: !!slug,
		staleTime: 30_000,
	});
}

export function useOrganizationMembers(slug: string) {
  return useQuery({
    queryKey: ["organization-members", slug],
    queryFn: async (): Promise<OrganizationMember[]> => {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(slug)}/members`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch organization members");
      const data = await res.json();
      return data.members ?? [];
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

async function postOrganizationMembership(slug: string, action: "join" | "leave") {
  const res = await fetch(
    `/api/orgs/${encodeURIComponent(slug)}/${action}`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.error ??
        (action === "join"
          ? "Failed to join organization"
          : "Failed to leave organization"),
    );
  }
}

export function useJoinOrganization(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postOrganizationMembership(slug, "join"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", slug] });
      queryClient.invalidateQueries({
        queryKey: ["organization-members", slug],
      });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useLeaveOrganization(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postOrganizationMembership(slug, "leave"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", slug] });
      queryClient.invalidateQueries({
        queryKey: ["organization-members", slug],
      });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useOrganizationRepositories(slug: string) {
  return useQuery({
    queryKey: ["organization-repos", slug],
    queryFn: async (): Promise<{ repositories: OrganizationRepo[]; total: number }> => {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(slug)}/repos`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch organization repositories");
      const data = await res.json();
      return {
        repositories: data.repositories ?? [],
        total: data.total ?? 0,
      };
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useOrganizationLanguages(slug: string) {
  return useQuery({
    queryKey: ["organization-languages", slug],
    queryFn: async (): Promise<OrganizationLanguage[]> => {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(slug)}/languages`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch organization languages");
      const data = await res.json();
      return data.languages ?? [];
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useCreateOrganizationRepository(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: CreateOrganizationRepoRequest,
    ): Promise<{ owner: string; name: string }> => {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(slug)}/repos`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? body?.message ?? "Failed to create repository",
        );
      }
      const data = await res.json();
      return data.repository;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-repos", slug],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization-languages", slug],
      });
    },
  });
}

export function useUpdateOrganization(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: OrganizationUpdateRequest,
    ): Promise<OrganizationDetail> => {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update organization");
      }
      const data = await res.json();
      return data.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", slug] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
		mutationFn: async (
			params: OrganizationCreateRequest,
		): Promise<OrganizationDetail> => {
			const res = await fetch("/api/orgs", {
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
				`/api/orgs?slug=${encodeURIComponent(slug)}`,
			);
			if (!res.ok) throw new Error("Failed to check slug");
			return res.json();
		},
		enabled: slug.length >= 2,
		staleTime: 5_000,
	});
}
