import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "#/i18n/lib/api-error";

export interface PersonOrg {
	id: number;
	name: string;
	slug: string;
	avatar: string | null;
}

export interface PersonTopRepo {
	owner: string;
	name: string;
}

export interface Person {
	id: string;
	username: string;
	avatar: string | null;
	email: string;
	profession: string | null;
	online: boolean;
	/** RFC3339 timestamp of the newest session update, null when never seen. */
	lastActive: string | null;
	/** RFC3339 account creation timestamp. */
	joinedAt: string;
	country: string | null;
	organizations: PersonOrg[];
	topRepo: PersonTopRepo | null;
}

export function usePeople() {
	return useQuery({
		queryKey: ["people"],
		queryFn: async (): Promise<Person[]> => {
			const res = await fetch("http://localhost:3200/api/people", {
				credentials: "include",
			});
			if (!res.ok)
				throw new Error(
					apiErrorMessage(null, { fallbackKey: "errors.client.fetchPeople" }),
				);
			const data = await res.json();
			return data.people ?? [];
		},
		staleTime: 30_000,
	});
}
