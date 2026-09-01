import { useNavigate } from "@tanstack/react-router";
import {
	CircleCheck,
	CircleDot,
	GitMerge,
	GitPullRequest,
	Plus,
	Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PullRequestItem from "./pr-item";

interface PullRequestsProps {
	owner: string;
	repo: string;
}

const dummyPullRequests = [
	{
		number: 12,
		title: "Add repository search",
		description: "Add search functionality to repositories.",
		author: {
			id: 1,
			username: "thefoxcost",
			displayName: "The Fox Cost",
			avatar: "",
		},
		sourceBranch: "feat/repository-search",
		targetBranch: "main",
		state: "open" as const,
		createdAt: "2026-09-01T18:00:00Z",
		updatedAt: "2026-09-01T19:00:00Z",
		mergedAt: null,
		closedAt: null,
		commentCount: 4,
	},
	{
		number: 11,
		title: "Improve commit diff viewer",
		description: "Improve the commit diff UI and navigation.",
		author: {
			id: 2,
			username: "moh",
			displayName: "Moh",
			avatar: "",
		},
		sourceBranch: "feat/diff-viewer",
		targetBranch: "main",
		state: "open" as const,
		createdAt: "2026-09-01T15:00:00Z",
		updatedAt: "2026-09-01T17:00:00Z",
		mergedAt: null,
		closedAt: null,
		commentCount: 2,
	},
	{
		number: 10,
		title: "Fix repository file tree navigation",
		description: "Fix navigation when opening folders and files.",
		author: {
			id: 3,
			username: "alex",
			displayName: "Alex",
			avatar: "",
		},
		sourceBranch: "fix/file-tree",
		targetBranch: "main",
		state: "open" as const,
		createdAt: "2026-08-31T14:00:00Z",
		updatedAt: "2026-08-31T18:00:00Z",
		mergedAt: null,
		closedAt: null,
		commentCount: 7,
	},
	{
		number: 9,
		title: "Add pull request comments",
		description: "Allow users to comment on pull requests.",
		author: {
			id: 4,
			username: "sarah",
			displayName: "Sarah",
			avatar: "",
		},
		sourceBranch: "feat/pr-comments",
		targetBranch: "main",
		state: "closed" as const,
		createdAt: "2026-08-29T12:00:00Z",
		updatedAt: "2026-08-30T16:00:00Z",
		mergedAt: null,
		closedAt: "2026-08-30T16:00:00Z",
		commentCount: 5,
	},
	{
		number: 8,
		title: "Update repository settings UI",
		description: "Redesign the repository settings page.",
		author: {
			id: 5,
			username: "john",
			displayName: "John",
			avatar: "",
		},
		sourceBranch: "refactor/settings",
		targetBranch: "main",
		state: "closed" as const,
		createdAt: "2026-08-27T10:00:00Z",
		updatedAt: "2026-08-28T13:00:00Z",
		mergedAt: null,
		closedAt: "2026-08-28T13:00:00Z",
		commentCount: 3,
	},
	{
		number: 7,
		title: "Improve README rendering",
		description: "Improve Markdown rendering inside repositories.",
		author: {
			id: 6,
			username: "maria",
			displayName: "Maria",
			avatar: "",
		},
		sourceBranch: "fix/readme",
		targetBranch: "main",
		state: "closed" as const,
		createdAt: "2026-08-24T09:00:00Z",
		updatedAt: "2026-08-26T11:00:00Z",
		mergedAt: null,
		closedAt: "2026-08-26T11:00:00Z",
		commentCount: 1,
	},
];

export default function PullRequests({
	owner,
	repo,
}: PullRequestsProps) {
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

	const pulls = dummyPullRequests.filter(
		(pull) => pull.state === tab,
	);

	const openCount = dummyPullRequests.filter(
		(pull) => pull.state === "open",
	).length;

	const closedCount = dummyPullRequests.filter(
		(pull) => pull.state === "closed",
	).length;

	const filteredPulls = pulls.filter((pull) => {
		const query = debouncedSearch.trim().toLowerCase();

		if (!query) {
			return true;
		}

		return (
			pull.title.toLowerCase().includes(query) ||
			String(pull.number).includes(query) ||
			pull.author.username.toLowerCase().includes(query) ||
			pull.sourceBranch.toLowerCase().includes(query) ||
			pull.targetBranch.toLowerCase().includes(query)
		);
	});

	return (
		<div className="my-5 mx-20 mb-10">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl">Pull Requests</h1>

				<Button
					onClick={() =>
						navigate({
							to: `/${owner}/${repo}/prs/new`,
						})
					}
					disabled
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
						setTab(
							value === "closed"
								? "closed"
								: "open",
						)
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
							onChange={(e) =>
								setSearch(e.target.value)
							}
						/>

						<InputGroupAddon>
							<Search size={16} />
						</InputGroupAddon>

						<InputGroupAddon align="inline-end">
							{filteredPulls.length} result
							{filteredPulls.length === 1
								? ""
								: "s"}
						</InputGroupAddon>
					</InputGroup>
				</Field>
			</div>

			<div className="mt-4 overflow-hidden rounded-md border">
				{filteredPulls.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 p-10">
						{tab === "open"
							? <GitPullRequest className="size-8 text-muted-foreground" />

							: <GitMerge className="size-8 text-muted-foreground" />
						}
						<p className="text-sm text-muted-foreground">
							No{" "}
							{tab === "open"
								? "open"
								: "closed"}{" "}
							pull requests found.
						</p>
					</div>
				) : (
					filteredPulls.map((pull) => (
						<PullRequestItem
							key={pull.number}
							{...pull}
							repoLabel={`${owner}/${repo}`}
							showAuthorAvatar
							onNavigate={() =>
								navigate({
									to: `/${owner}/${repo}/prs/${pull.number}`,
								})
							}
						/>
					))
				)}
			</div>
		</div>
	);
}