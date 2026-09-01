import { useNavigate } from "@tanstack/react-router";
import {
	Archive,
	BookMarked,
	Check,
	ChevronDown,
	CircleCheck,
	CircleDot,
	GitFork,
	MirrorRectangular,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Contributor } from "#/components/repo/contributor-avatars";
import IssueItem from "#/components/repo/issues/issue-item";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Field } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import { Spinner } from "#/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { useGlobalIssues } from "#/hooks/useGlobalIssues";
import useUserRepos from "#/hooks/useUserRepos";
import { useUsers } from "#/hooks/useUsers";
import { authClient } from "#/lib/auth-client";
import type { IssueFilters, IssueSort } from "#/types/issues";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "../ui/separator";

const sortOptions: { value: IssueSort; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "recently-updated", label: "Most recently updated" },
	{ value: "least-updated", label: "Least recently updated" },
	{ value: "most-commented", label: "Most commented" },
	{ value: "least-commented", label: "Least commented" },
	{ value: "nearest-due", label: "Nearest due date" },
	{ value: "farthest-due", label: "Farthest due date" },
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

function Issues() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const { repos } = useUserRepos();

	const [tab, setTab] = useState<"open" | "close">("open");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [author, setAuthor] = useState<string | undefined>();
	const [assignee, setAssignee] = useState<string | undefined>();
	const [sort, setSort] = useState<IssueSort>("newest");

	const [authorQuery, setAuthorQuery] = useState("");
	const [assigneeQuery, setAssigneeQuery] = useState("");

	useEffect(() => {
		const id = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(id);
	}, [search]);

	const filters: IssueFilters = useMemo(
		() => ({
			state: tab === "open" ? "open" : "closed",
			search: debouncedSearch.trim() || undefined,
			author,
			assignee,
			sort,
		}),
		[tab, debouncedSearch, author, assignee, sort],
	);

	const { data, isLoading, isError, refetch } = useGlobalIssues(filters);
	const { data: users = [] } = useUsers();

	const activeAuthor = users.find((user) => user.id === author);
	const activeAssignee = users.find((user) => user.id === assignee);
	const activeSortLabel =
		sortOptions.find((option) => option.value === sort)?.label ?? "Sort";

	const authorList = matchQuery(users, authorQuery);
	const assigneeList = matchQuery(users, assigneeQuery);

	const username = session?.user.name;

	return (
		<div className=" my-1">
			<h1 className="text-2xl">All issues</h1>
			<Separator className="my-2 mb-4" />
			<div className="my-2 flex flex-row items-center justify-between">
				<Tabs
					value={tab}
					onValueChange={(value) =>
						setTab(value === "close" ? "close" : "open")
					}
					className="w-auto"
				>
					<TabsList>
						<TabsTrigger value="open">
							<CircleDot />
							Open {data ? `(${data.open})` : ""}
						</TabsTrigger>

						<TabsTrigger value="close">
							<CircleCheck />
							Closed {data ? `(${data.closed})` : ""}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Field className="mx-3 w-full">
					<InputGroup>
						<InputGroupInput
							placeholder="Search issues..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>

						<InputGroupAddon>
							<Search size={16} />
						</InputGroupAddon>

						<InputGroupAddon align="inline-end">
							{data?.issues.length ?? 0} result
							{(data?.issues.length ?? 0) === 1 ? "" : "s"}
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

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{activeAssignee ? activeAssignee.username : "Assigned"}
								<ChevronDown />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-auto">
							<DropdownMenuGroup>
								<Input
									placeholder="Type to search"
									className="w-[200px]"
									value={assigneeQuery}
									onChange={(e) => setAssigneeQuery(e.target.value)}
								/>

								<DropdownMenuItem
									className="mt-2"
									onClick={() => {
										setAssignee("none");
										setAssigneeQuery("");
									}}
								>
									<span className="flex items-center gap-2">
										{assignee === "none" && <Check size={14} />}
										Assigned to nobody
									</span>
								</DropdownMenuItem>

								<DropdownMenuItem
									onClick={() => {
										setAssignee(undefined);
										setAssigneeQuery("");
									}}
								>
									<span className="flex items-center gap-2">
										{!assignee && <Check size={14} />}
										Any assignee
									</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								<DropdownMenuLabel>Users</DropdownMenuLabel>

								{assigneeList.map((user) => (
									<DropdownMenuItem
										key={user.id || user.username}
										onClick={() => {
											setAssignee(user.id);
											setAssigneeQuery("");
										}}
									>
										<span className="flex items-center gap-2">
											<UserAvatar user={user} />
											<span className="ml-2">{user.username}</span>
										</span>
									</DropdownMenuItem>
								))}

								{assigneeList.length === 0 && (
									<DropdownMenuItem disabled>No users found</DropdownMenuItem>
								)}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button>
								New Issue
								<ChevronDown className="size-4 opacity-60" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="end" className="w-56 p-1">
							<DropdownMenuLabel>Choose your repo</DropdownMenuLabel>

							<DropdownMenuSeparator />

							{repos.length === 0 ? (
								<DropdownMenuItem disabled>
									No repositories found
								</DropdownMenuItem>
							) : (
								repos.map((repo) => (
									<DropdownMenuItem
										key={repo.name}
										onClick={() =>
											navigate({
												to: `/${username}/${repo.name}/issues/new`,
											})
										}
									>
										<span className="flex w-full items-center gap-2">
											{repo.forked ? (
												<GitFork className="size-4 shrink-0 text-muted-foreground" />
											) : (
												<BookMarked className="size-4 shrink-0 text-muted-foreground" />
											)}
											<span className="min-w-0 flex-1 truncate">
												{repo.name}
											</span>
											{repo.mirrored ? (
												<MirrorRectangular className="shrink-0 text-muted-foreground" />
											) : repo.archived ? (
												<Archive className="shrink-0 text-muted-foreground" />
											) : null}
										</span>
									</DropdownMenuItem>
								))
							)}
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
							Failed to load issues.
						</p>
						<Button variant="outline" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				) : (data?.issues.length ?? 0) === 0 ? (
					<p className="p-10 text-center text-sm text-muted-foreground">
						No {tab === "open" ? "open" : "closed"} issues found.
					</p>
				) : (
					data?.issues.map((issue) => (
						<IssueItem
							key={issue.id}
							{...issue}
							repoLabel={`${issue.owner}/${issue.repo}`}
							showAuthorAvatar
							onNavigate={() =>
								navigate({
									to: `/${issue.owner}/${issue.repo}/issues/${issue.number}`,
								})
							}
						/>
					))
				)}
			</div>
		</div>
	);
}

export default Issues;
