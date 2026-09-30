import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronDown, CircleCheck, CircleDot, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Field } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { InputGroup, InputGroupInput } from "#/components/ui/input-group";
import { Separator } from "#/components/ui/separator";
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

const sortOptions: { value: IssueSort; labelKey: string }[] = [
	{ value: "newest", labelKey: "issues.sort.newest" },
	{ value: "oldest", labelKey: "issues.sort.oldest" },
	{
		value: "recently-updated",
		labelKey: "issues.sort.mostRecentlyUpdated",
	},
	{
		value: "least-updated",
		labelKey: "issues.sort.leastRecentlyUpdated",
	},
	{ value: "most-commented", labelKey: "issues.sort.mostCommented" },
	{ value: "least-commented", labelKey: "issues.sort.leastCommented" },
	{ value: "nearest-due", labelKey: "issues.sort.nearestDueDate" },
	{ value: "farthest-due", labelKey: "issues.sort.farthestDueDate" },
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
	const { t } = useTranslation();
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
		sortOptions.find((option) => option.value === sort)?.labelKey ??
		"issues.sort.label";

	const authorList = matchQuery(contributors, authorQuery);
	const assigneeList = matchQuery(contributors, assigneeQuery);

	return (
		<div className="mx-30 my-5">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl">{t("issues.title")}</h1>
				<Button
					onClick={() => navigate({ to: `/${username}/${repo}/issues/new` })}
				>
					<Plus className="size-4" />
					{t("issues.newIssue")}
				</Button>
			</div>

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
							{t("issues.openTab", {
								count: data ? ` (${data.open})` : "",
							})}
						</TabsTrigger>

						<TabsTrigger value="close">
							<CircleCheck />
							{t("issues.closedTab", {
								count: data ? ` (${data.closed})` : "",
							})}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Field className="mx-3 w-full">
					<InputGroup>
						<InputGroupInput
							placeholder={t("common.states.typeToSearch")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</InputGroup>
				</Field>

				<div className="flex flex-row items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{activeAuthor
									? activeAuthor.username
									: t("issues.filters.author")}
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
										{t("issues.filters.anyAuthor")}
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
										{t("issues.filters.noContributors")}
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

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								{activeAssignee
									? activeAssignee.username
									: t("issues.filters.assigned")}
								<ChevronDown />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-auto">
							<DropdownMenuGroup>
								<Input
									placeholder={t("common.states.typeToSearch")}
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
										{t("issues.filters.assignedToNobody")}
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
										{t("issues.filters.anyAssignee")}
									</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								<DropdownMenuLabel>
									{t("issues.filters.contributors")}
								</DropdownMenuLabel>

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
										{t("issues.filters.noContributors")}
									</DropdownMenuItem>
								)}
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
							{t("issues.loadFailed")}
						</p>
						<Button variant="outline" onClick={() => refetch()}>
							{t("common.actions.retry")}
						</Button>
					</div>
				) : (data?.issues.length ?? 0) === 0 ? (
					<p className="p-10 text-center text-sm text-muted-foreground">
						{tab === "open" ? t("issues.emptyOpen") : t("issues.emptyClosed")}
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
