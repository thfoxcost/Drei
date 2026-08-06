"use client";

import { useNavigate } from "@tanstack/react-router";
import { FolderGit2Icon, SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

interface Repo {
	name: string;
	description: string;
	tags: string[];
	language: string;
	lastUpdated: string;
	stars: number;
	forks: number;
	license: string;
}

export function Cmd() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const [open, setOpen] = useState(false);
	const [repos, setRepos] = useState<Repo[]>([]);
	const [loading, setLoading] = useState(false);
	const loaded = useRef(false);

	const username = session?.user.name;

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.repeat) return;

			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		if (!open || loaded.current || !username) return;

		let cancelled = false;

		async function getRepos() {
			setLoading(true);

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
					loaded.current = true;
				}
			} catch (err) {
				console.error(err);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		getRepos();

		return () => {
			cancelled = true;
		};
	}, [open, username]);

	const isLoading = loading || !username;

	const handleSelect = (repo: Repo) => {
		if (!username) return;

		setOpen(false);

		navigate({
			to: "/$username/$repo",
			params: {
				username,
				repo: repo.name,
			},
		});
	};

	return (
		<>
			<Button onClick={() => setOpen(true)} variant="outline" className="w-52">
				<SearchIcon className="size-4" />
				Search repositories...
				<Kbd className="ml-auto px-3">⌘K</Kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command className="**:data-[selected=true]:bg-muted **:data-selected:bg-transparent">
					<CommandInput
						placeholder="Search repos..."
						className="placeholder:text-muted-foreground"
					/>
					<CommandList>
						<CommandEmpty>
							{isLoading ? "Loading repositories..." : "No repositories found"}
						</CommandEmpty>
						{isLoading && repos.length === 0 && (
							<CommandItem disabled className="gap-2.5">
								<Spinner className="size-4 shrink-0" />
								<span className="text-muted-foreground">
									Loading repositories...
								</span>
							</CommandItem>
						)}
						<CommandGroup heading="Repositories">
							{repos.map((repo) => (
								<CommandItem
									key={repo.name}
									value={repo.name}
									className="gap-2.5 flex items-center justify-between"
									onSelect={() => handleSelect(repo)}
								>
                  <div className="flex flex-row gap-2">
									<FolderGit2Icon className="size-4 shrink-0" />
									<span className="truncate font-medium">{repo.name}</span>
								</div>
                	<span data-slot="command-shortcut">
										<Badge variant="outline">{repo.language}</Badge>
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
}
