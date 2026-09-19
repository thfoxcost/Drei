import { useNavigate } from "@tanstack/react-router";
import {
	Check,
	ChevronDown,
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	Plus,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePullRequests } from "#/hooks/PRs/use-pull-requests";
import { useUsers } from "#/hooks/useUsers";
import type { PRFilters, PRSort } from "#/types/prs";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PullRequestItem from "./pr-item";

const sortOptions: { value: PRSort; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "recently-updated", label: "Most recently updated" },
	{ value: "least-updated", label: "Least recently updated" },
	{ value: "most-commented", label: "Most commented" },
	{ value: "least-commented", label: "Least commented" },
	{ value: "source-branch", label: "Source branch" },
	{ value: "target-branch", label: "Target branch" },
];

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function matchQuery(users: Contributor[], query: string): Contributor[] {
	const q = query.trim().toLowerCase();
	if (!q) return users;
	return users.filter((user) => user.username.toLowerCase().includes(q));
}

function UserAvatar({ user }: { user: Contributor }) {
	return (
		<Avatar size="sm">
			{user.avatar ? (
				<AvatarImage src={user.avatar} alt={user.username} />
			) : null}
			<AvatarFallback>{getInitials(user.username)}</AvatarFallback>
		</Avatar>
	);
}

interface PullRequestsProps {
	owner: string;
	repo: string;
}

export default function PullRequests({ owner, repo }: PullRequestsProps) {
	const navigate = useNavigate();

	const [tab, setTab] = useState<"open" | "closed" | "merged">("open");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [author, setAuthor] = useState<string | undefined>();
	const [sort, setSort] = useState<PRSort>("newest");
	const [authorQuery, setAuthorQuery] = useState("");

	useEffect(() => {
		const id = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(id);
	}, [search]);

	const filters: PRFilters = useMemo(
		() => ({
			state: tab,
			search: debouncedSearch.trim() || undefined,
			author,
			sort,
		}),
		[tab, debouncedSearch, author, sort],
	);

	const { data, isLoading, isError, refetch } = usePullRequests(
		owner,
		repo,
		filters,
	);
	const { data: users = [] } = useUsers();

	const pulls = data?.pulls ?? [];
	const openCount = data?.open ?? 0;
	const closedCount = data?.closed ?? 0;
	const mergedCount = data?.merged ?? 0;

	const activeAuthor = users.find((user) => user.id === author);
	const activeSortLabel =
		sortOptions.find((option) => option.value === sort)?.label ?? "Sort";

	const authorList = matchQuery(users, authorQuery);

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
						setTab(value as "open" | "closed" | "merged")
					}
					className="w-auto"
				>
					<TabsList>
						<TabsTrigger value="open">
							<GitPullRequest />
							Open ({openCount})
						</TabsTrigger>

						<TabsTrigger value="closed">
							<GitPullRequestClosed />
							Closed ({closedCount})
						</TabsTrigger>

						<TabsTrigger value="merged">
							<GitMerge />
							Merged ({mergedCount})
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Field className="w-full">
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

				<div className="flex flex-row items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{activeAuthor ? activeAuthor.username : "Author"}
								<ChevronDown />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-auto">
							<DropdownMenuGroup>
								<Input
									placeholder="Type to search"
									className="w-[200px]"
									value={authorQuery}
									onChange={(e) => setAuthorQuery(e.target.value)}
								/>
							</DropdownMenuGroup>

							<DropdownMenuSeparator className="my-2" />

							<DropdownMenuGroup>
								<DropdownMenuItem
									onClick={() => {
										setAuthor(undefined);
										setAuthorQuery("");
									}}
								>
									<span className="flex items-center gap-2">
										{!activeAuthor && <Check size={14} />}
										Any author
									</span>
								</DropdownMenuItem>

								{authorList.map((user) => (
									<DropdownMenuItem
										key={user.id || user.username}
										onClick={() => {
											setAuthor(user.id);
											setAuthorQuery("");
										}}
									>
										<span className="flex items-center gap-2">
											<UserAvatar user={user} />
											<span className="ml-1">{user.username}</span>
										</span>
									</DropdownMenuItem>
								))}

								{authorList.length === 0 && (
									<DropdownMenuItem disabled>No users found</DropdownMenuItem>
								)}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{activeSortLabel}
								<ChevronDown />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-auto">
							<DropdownMenuGroup>
								{sortOptions.map((option) => (
									<DropdownMenuItem
										key={option.value}
										onClick={() => setSort(option.value)}
									>
										<span className="flex items-center gap-2">
											{sort === option.value && <Check size={14} />}
											{option.label}
										</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
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
						) : tab === "closed" ? (
							<GitPullRequestClosed className="size-8 text-muted-foreground" />
						) : (
							<GitMerge className="size-8 text-muted-foreground" />
						)}
						<p className="text-sm text-muted-foreground">
							No {tab} pull requests found.
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
