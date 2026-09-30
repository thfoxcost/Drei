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
import { useTranslation } from "react-i18next";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { usePullRequests } from "#/hooks/PRs/use-pull-requests";
import { useUsers } from "#/hooks/useUsers";
import type { PRFilters, PRSort } from "#/types/prs";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
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

const sortOptions: { value: PRSort; labelKey: string }[] = [
	{ value: "newest", labelKey: "pulls.sort.newest" },
	{ value: "oldest", labelKey: "pulls.sort.oldest" },
	{ value: "recently-updated", labelKey: "pulls.sort.mostRecentlyUpdated" },
	{ value: "least-updated", labelKey: "pulls.sort.leastRecentlyUpdated" },
	{ value: "most-commented", labelKey: "pulls.sort.mostCommented" },
	{ value: "least-commented", labelKey: "pulls.sort.leastCommented" },
	{ value: "source-branch", labelKey: "pulls.sort.sourceBranch" },
	{ value: "target-branch", labelKey: "pulls.sort.targetBranch" },
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
	const { t } = useTranslation();
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
		sortOptions.find((option) => option.value === sort)?.labelKey ??
		"pulls.sort.label";

	const authorList = matchQuery(users, authorQuery);

	return (
		<div className="my-5 mx-30 mb-10">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl">{t("pulls.title")}</h1>

				<Button
					onClick={() =>
						navigate({
							to: `/${owner}/${repo}/compare`,
						})
					}
				>
					<Plus className="size-4" />
					{t("pulls.newPull")}
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
							{t("pulls.openTab", { count: openCount })}
						</TabsTrigger>

						<TabsTrigger value="closed">
							<GitPullRequestClosed />
							{t("pulls.closedTab", { count: closedCount })}
						</TabsTrigger>

						<TabsTrigger value="merged">
							<GitMerge />
							{t("pulls.mergedTab", { count: mergedCount })}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Field className="w-full">
					<InputGroup>
						<InputGroupInput
							placeholder={t("pulls.searchPlaceholder")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>

						<InputGroupAddon>
							<Search size={16} />
						</InputGroupAddon>

						<InputGroupAddon align="inline-end">
							{t("common.counts.results", {
								count: pulls.length,
							})}
						</InputGroupAddon>
					</InputGroup>
				</Field>

				<div className="flex flex-row items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{activeAuthor
									? activeAuthor.username
									: t("pulls.filters.author")}
								<ChevronDown />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-auto">
							<DropdownMenuGroup>
								<Input
									placeholder={t("common.states.typeToSearch")}
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
										{t("pulls.filters.anyAuthor")}
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
									<DropdownMenuItem disabled>
										{t("pulls.filters.noUsers")}
									</DropdownMenuItem>
								)}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{t(activeSortLabel)}
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
											{t(option.labelKey)}
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
							{t("pulls.loadFailed")}
						</p>
						<Button variant="outline" onClick={() => refetch()}>
							{t("common.actions.retry")}
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
							{t("pulls.empty", {
								tab: t(`pulls.state.${tab}`),
							})}
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
