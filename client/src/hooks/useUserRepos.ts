import { useEffect, useState } from "react";

import { authClient } from "#/lib/auth-client";

interface Repo {
	name: string;
	description: string;
	tags: string[];
	language: string;
	lastUpdated: string;

	// dummy from backend for now
	stars: number;
	forks: number;
	license: string;
}

function useUserRepos() {
	const { data: session } = authClient.useSession();

	const [repos, setRepos] = useState<Repo[]>([]);

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
			}
		}

		getRepos();

		return () => {
			cancelled = true;
		};
	}, [username]);

	return repos;
}

export default useUserRepos;
