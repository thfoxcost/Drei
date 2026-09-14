import { useNavigate } from "@tanstack/react-router";
import { GitMerge, GitPullRequest, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { usePullRequests } from "#/hooks/PRs/use-pull-requests";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PullRequestItem from "./pr-item";

interface PullRequestsProps {
	owner: string;
	repo: string;
}

export default function PullRequests({ owner, repo }: PullRequestsProps) {
	const navigate = useNavigate();

	const [tab, setTab] = useState<"open" | "closed">("open");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const id = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);

		return () => clearTimeout(id);
	}, [search]);

	const { data, isLoading, isError, refetch } = usePullRequests(owner, repo, {
		state: tab,
		search: debouncedSearch || undefined,
	});

	const pulls = data?.pulls ?? [];
	const openCount = data?.open ?? 0;
	const closedCount = data?.closed ?? 0;

	return (
		<div className="my-5 mx-30 mb-10">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl">Pull Requests</h1>

				<Button
					onClick={() =>
						navigate({
							to: `/${owner}/${repo}/compare`,
						})
					}
				>
					<Plus className="size-4" />
					New Pull Request
				</Button>
			</div>

			<Separator className="my-2 mb-4" />

			<div className="my-2 flex flex-row items-center justify-between gap-3">
				<Tabs
					value={tab}
					onValueChange={(value) =>
						setTab(value === "closed" ? "closed" : "open")
					}
					className="w-auto"
				>
					<TabsList>
						<TabsTrigger value="open">
							<GitPullRequest />
							Open ({openCount})
						</TabsTrigger>

						<TabsTrigger value="closed">
							<GitMerge />
							Closed ({closedCount})
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Field className=" w-full">
					<InputGroup>
						<InputGroupInput
							placeholder="Search pull requests..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>

						<InputGroupAddon>
							<Search size={16} />
						</InputGroupAddon>

						<InputGroupAddon align="inline-end">
							{pulls.length} result
							{pulls.length === 1 ? "" : "s"}
						</InputGroupAddon>
					</InputGroup>
				</Field>
			</div>

			<div className="mt-4 overflow-hidden rounded-md border">
				{isLoading && !data ? (
					<div className="flex items-center justify-center p-10">
						<Spinner />
					</div>
				) : isError ? (
					<div className="flex flex-col items-center gap-2 p-10">
						<p className="text-sm text-muted-foreground">
							Failed to load pull requests.
						</p>
						<Button variant="outline" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				) : pulls.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 p-10">
						{tab === "open" ? (
							<GitPullRequest className="size-8 text-muted-foreground" />
						) : (
							<GitMerge className="size-8 text-muted-foreground" />
						)}
						<p className="text-sm text-muted-foreground">
							No {tab === "open" ? "open" : "closed"} pull requests found.
						</p>
					</div>
				) : (
					pulls.map((pull) => (
						<PullRequestItem
							key={pull.number}
							{...pull}
							repoLabel={`${owner}/${repo}`}
							showAuthorAvatar
							onNavigate={() =>
								navigate({
									to: `/${owner}/${repo}/pulls/${pull.number}`,
								})
							}
						/>
					))
				)}
			</div>
		</div>
	);
}
