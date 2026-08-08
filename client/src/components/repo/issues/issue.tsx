import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronDown, CircleCheck, CircleDot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Field } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { InputGroup, InputGroupInput } from "#/components/ui/input-group";
import { Spinner } from "#/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { type IssueFilters, useIssues } from "#/hooks/useIssues";
import { useRepoData } from "#/hooks/useRepoData";
import type { IssueSort } from "#/types/issues";
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
import IssueItem from "./issue-item";

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

function matchQuery(contributors: Contributor[], query: string): Contributor[] {
	const q = query.trim().toLowerCase();
	if (!q) return contributors;
	return contributors.filter((c) => c.username.toLowerCase().includes(q));
}

function ContributorAvatar({ contributor }: { contributor: Contributor }) {
	return (
		<Avatar size="sm">
			{contributor.avatar ? (
				<AvatarImage src={contributor.avatar} alt={contributor.username} />
			) : null}
			<AvatarFallback>{getInitials(contributor.username)}</AvatarFallback>
		</Avatar>
	);
}

function Issues() {
	const { username, repo } = useParams({ strict: false });
	const navigate = useNavigate();

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

	const { data, isLoading, isError, refetch } = useIssues(
		username,
		repo,
		filters,
	);
	const { data: repoData } = useRepoData(username, repo);

	const contributors = repoData?.contributors ?? [];
	const activeAuthor = contributors.find((c) => c.id === author);
	const activeAssignee = contributors.find((c) => c.id === assignee);
	const activeSortLabel =
		sortOptions.find((option) => option.value === sort)?.label ?? "Sort";

	const authorList = matchQuery(contributors, authorQuery);
	const assigneeList = matchQuery(contributors, assigneeQuery);

	return (
		<div className="mx-40">
			<h1 className="mb-4 text-2xl font-semibold">All issues</h1>

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
							placeholder="Type to search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
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

								{authorList.map((contributor) => (
									<DropdownMenuItem
										key={contributor.id || contributor.username}
										onClick={() => {
											setAuthor(contributor.id);
											setAuthorQuery("");
										}}
									>
										<span className="flex items-center gap-2">
											<ContributorAvatar contributor={contributor} />
											<span className="ml-1">{contributor.username}</span>
										</span>
									</DropdownMenuItem>
								))}

								{authorList.length === 0 && (
									<DropdownMenuItem disabled>
										No contributors found
									</DropdownMenuItem>
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
								<DropdownMenuLabel>Contributors</DropdownMenuLabel>

								{assigneeList.map((contributor) => (
									<DropdownMenuItem
										key={contributor.id || contributor.username}
										onClick={() => {
											setAssignee(contributor.id);
											setAssigneeQuery("");
										}}
									>
										<span className="flex items-center gap-2">
											<ContributorAvatar contributor={contributor} />
											<span className="ml-2">{contributor.username}</span>
										</span>
									</DropdownMenuItem>
								))}

								{assigneeList.length === 0 && (
									<DropdownMenuItem disabled>
										No contributors found
									</DropdownMenuItem>
								)}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						className="bg-green-700 text-white hover:bg-green-800"
						onClick={() => navigate({ to: `/${username}/${repo}/issues/new` })}
					>
						New Issue
					</Button>
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
							onNavigate={(number) =>
								navigate({ to: `/${username}/${repo}/issues/${number}` })
							}
							{...issue}
						/>
					))
				)}
			</div>
		</div>
	);
}

export default Issues;
