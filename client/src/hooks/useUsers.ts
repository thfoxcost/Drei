import { useQuery } from "@tanstack/react-query";
import type { Contributor } from "#/components/repo/contributor-avatars";

export function useUsers() {
	return useQuery({
		queryKey: ["users"],
		queryFn: async (): Promise<Contributor[]> => {
			const res = await fetch("http://localhost:3200/api/users");
			if (!res.ok) throw new Error("Failed to fetch users");
			const data = await res.json();
			return data.users ?? [];
		},
		staleTime: 60_000,
	});
}
