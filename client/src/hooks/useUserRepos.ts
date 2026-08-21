import { useEffect, useState } from "react";

import { authClient } from "#/lib/auth-client";

export interface Repo {
	owner: string;
	name: string;
	description: string;
	tags: string[];
	language: string;
	lastUpdated: string;
	lastUpdatedAt?: string;

	visibility: boolean;
	archived: boolean;
	forked: boolean;
	forkedFromOwner: string;
	forkedFromName: string;
	mirrored: boolean;

	// dummy from backend for now
	stars: number;
	forks: number;
	license: string;
}

function useUserRepos() {
	const { data: session } = authClient.useSession();

	const [repos, setRepos] = useState<Repo[]>([]);
	const [loaded, setLoaded] = useState(false);

	const username = session?.user.name;

	useEffect(() => {
		if (!username) return;

		let cancelled = false;

		async function getRepos() {
			try {
				const res = await fetch(
					`http://localhost:3200/api/users/${username}/repos`,
				);

				if (!res.ok) {
					throw new Error("Failed to fetch repos");
				}

				const data: Repo[] = await res.json();

				if (!cancelled) {
					setRepos(data);
				}
			} catch (err) {
				console.error(err);
			} finally {
				if (!cancelled) {
					setLoaded(true);
				}
			}
		}

		getRepos();

		return () => {
			cancelled = true;
		};
	}, [username]);

	return { repos, loaded };
}

export default useUserRepos;
