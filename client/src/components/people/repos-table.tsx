import { useTranslation } from "react-i18next";

import { dateFnsLocale } from "#/i18n/lib/format";

("use client");

import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BookMarked,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleDot,
	GitFork,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { ProfessionIcon } from "#/components/profession-icon";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "#/components/ui/hover-card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import { Spinner } from "#/components/ui/spinner";
import { useAllRepos } from "#/hooks/useAllRepos";
import { useIssues } from "#/hooks/useIssues";
import { type Person, usePeople } from "#/hooks/usePeople";
import type { Repo } from "#/hooks/useUserRepos";
import { getCountryCode } from "#/lib/countries";
import { getLanguageColor } from "#/lib/language-color";

const PAGE_SIZE_OPTIONS = [5, 8, 12, 13];

type SortKey = "smart" | "name" | "updated";

function repoTimestamp(repo: Repo): number {
	const raw = repo.lastUpdatedAt ?? repo.lastUpdated;
	const time = raw ? Date.parse(raw) : Number.NaN;
	return Number.isFinite(time) ? time : 0;
}

function sortRepos(repos: Repo[], key: SortKey, dir: "asc" | "desc"): Repo[] {
	const factor = dir === "asc" ? 1 : -1;
	return [...repos].sort((a, b) => {
		switch (key) {
			case "smart":
				// Logical default: most recently updated first, then name.
				return (
					repoTimestamp(b) - repoTimestamp(a) || a.name.localeCompare(b.name)
				);
			case "name":
				return (
					a.name.localeCompare(b.name) * factor ||
					a.owner.localeCompare(b.owner) * factor
				);
			case "updated":
				return (repoTimestamp(a) - repoTimestamp(b)) * factor;
			default:
				return 0;
		}
	});
}

interface SortHeaderProps {
	label: string;
	sortKey: SortKey;
	activeKey: SortKey;
	dir: "asc" | "desc";
	onSort: (key: SortKey) => void;
}

function SortHeader({
	label,
	sortKey,
	activeKey,
	dir,
	onSort,
}: SortHeaderProps) {
	const active = activeKey === sortKey;
	return (
		<button
			type="button"
			onClick={() => onSort(sortKey)}
			className="inline-flex cursor-pointer items-center gap-1.5 hover:text-foreground"
		>
			{label}
			{active ? (
				dir === "asc" ? (
					<ArrowUp className="size-3.5" />
				) : (
					<ArrowDown className="size-3.5" />
				)
			) : (
				<ArrowUpDown className="size-3.5 opacity-50" />
			)}
		</button>
	);
}

function PlainHeader({ label }: { label: string }) {
	return <span>{label}</span>;
}

function OpenIssuesCell({ owner, repo }: { owner: string; repo: string }) {
	const { data, isLoading } = useIssues(owner, repo, { state: "open" });

	if (isLoading) {
		return <span className="text-muted-foreground">—</span>;
	}

	return (
		<div className="flex items-center gap-1.5 text-muted-foreground">
			<CircleDot className="size-4" />
			<span>{data?.open ?? 0}</span>
		</div>
	);
}

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function OwnerHover({
	username,
	person,
}: {
	username: string;
	person: Person | undefined;
}) {
	const code = getCountryCode(person?.country ?? null);

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Link
					to="/$username"
					params={{ username }}
					className="text-foreground hover:text-primary hover:underline"
				>
					@{username}
				</Link>
			</HoverCardTrigger>
			<HoverCardContent align="start">
				{person ? (
					<div className="space-y-2">
						<div className="flex items-center gap-2.5">
							<Avatar className="size-10">
								{person.avatar && (
									<AvatarImage src={person.avatar} alt={person.username} />
								)}
								<AvatarFallback>{getInitials(person.username)}</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<p className="truncate font-bold">{person.username}</p>
								<p className="truncate text-xs text-muted-foreground">
									@{person.username}
								</p>
							</div>
						</div>
						{person.profession && (
							<p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
								<ProfessionIcon className="size-3.5 shrink-0" />
								<span className="truncate">{person.profession}</span>
							</p>
						)}
						<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
							{code ? (
								<span className="flex items-center gap-1.5">
									<ReactCountryFlag
										countryCode={code}
										svg
										style={{ width: "18px", borderRadius: "3px" }}
									/>
									{person.country}
								</span>
							) : (
								<span>—</span>
							)}
							<span>
								Joined{" "}
								{format(new Date(person.joinedAt), "MMM, yyyy", {
									locale: dateFnsLocale(),
								})}
							</span>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">@{username}</p>
				)}
			</HoverCardContent>
		</HoverCard>
	);
}

export function ReposTable() {
	const { t } = useTranslation();
	const { data: repos = [], isLoading, isError, refetch } = useAllRepos();
	const { data: people = [] } = usePeople();
	const peopleByName = useMemo(() => {
		const map = new Map<string, Person>();
		for (const person of people) {
			map.set(person.username.toLowerCase(), person);
		}
		return map;
	}, [people]);
	const [sortKey, setSortKey] = useState<SortKey>("smart");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(13);
	const [query, setQuery] = useState("");
	const [type, setType] = useState<"all" | "source" | "forked">("all");
	const [language, setLanguage] = useState<string | null>(null);

	const availableLanguages = useMemo(() => {
		const found = new Set<string>();
		for (const repo of repos) {
			if (repo.language) found.add(repo.language);
		}
		return Array.from(found).sort((a, b) => a.localeCompare(b));
	}, [repos]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return repos.filter((repo) => {
			if (
				q &&
				!repo.name.toLowerCase().includes(q) &&
				!repo.owner.toLowerCase().includes(q) &&
				!(repo.description ?? "").toLowerCase().includes(q)
			) {
				return false;
			}
			if (type === "source" && repo.forked) return false;
			if (type === "forked" && !repo.forked) return false;
			if (language && repo.language !== language) return false;
			return true;
		});
	}, [repos, query, type, language]);

	function resetPage() {
		setPageIndex(0);
	}

	const sorted = useMemo(
		() => sortRepos(filtered, sortKey, sortDir),
		[filtered, sortKey, sortDir],
	);
	const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
	const safePageIndex = Math.min(pageIndex, pageCount - 1);
	const page = sorted.slice(
		safePageIndex * pageSize,
		safePageIndex * pageSize + pageSize,
	);

	function handleSort(key: SortKey) {
		if (key === sortKey) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
		setPageIndex(0);
	}

	const typeLabel =
		type === "all"
			? t("people.reposTable.filterTypeLabel")
			: type === "source"
				? t("repositories.types.source")
				: t("repositories.types.forked");
	const languageLabel = language ?? t("people.reposTable.filterLanguageLabel");

	if (isLoading) {
		return (
			<Card className="p-0">
				<div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
					<Spinner />
					<span>{t("people.reposTable.loading")}</span>
				</div>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="p-0">
				<div className="flex flex-col items-center gap-2 p-10">
					<p className="text-sm text-muted-foreground">
						{t("people.reposTable.loadFailed")}
					</p>
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						{t("common.actions.retry")}
					</Button>
				</div>
			</Card>
		);
	}

	if (repos.length === 0) {
		return (
			<Card className="p-0">
				<p className="p-10 text-center text-sm text-muted-foreground">
					{t("people.reposTable.empty")}
				</p>
			</Card>
		);
	}

	const rangeStart = sorted.length === 0 ? 0 : safePageIndex * pageSize + 1;
	const rangeEnd = Math.min(safePageIndex * pageSize + pageSize, sorted.length);

	return (
		<div className="w-full space-y-2.5">
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="min-w-52 flex-1">
					<InputGroupInput
						placeholder={t("people.reposTable.searchPlaceholder")}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							resetPage();
						}}
					/>
					<InputGroupAddon>
						<Search size={16} />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						{t("common.counts.results", { count: sorted.length })}
					</InputGroupAddon>
				</InputGroup>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label={t("people.reposTable.filterType")}
						>
							{typeLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={type}
							onValueChange={(value) => {
								setType(value as "all" | "source" | "forked");
								resetPage();
							}}
						>
							<DropdownMenuRadioItem value="all">
								{t("repositories.types.all")}
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="source">
								{t("repositories.types.source")}
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="forked">
								{t("repositories.types.forked")}
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label={t("people.reposTable.filterLanguage")}
						>
							{languageLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={language ?? "all"}
							onValueChange={(value) => {
								setLanguage(value === "all" ? null : value);
								resetPage();
							}}
						>
							<DropdownMenuRadioItem value="all">
								{t("repositories.types.all")}
							</DropdownMenuRadioItem>
							{availableLanguages.map((name) => (
								<DropdownMenuRadioItem key={name} value={name}>
									{name}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Card className="p-0">
				<div className="w-full overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr className="border-b text-left font-medium text-muted-foreground">
								<th className="px-3 py-2 whitespace-nowrap">
									<SortHeader
										label={t("people.reposTable.columns.repository")}
										sortKey="name"
										activeKey={sortKey}
										dir={sortDir}
										onSort={handleSort}
									/>
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader label={t("people.reposTable.columns.owner")} />
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader
										label={t("people.reposTable.columns.description")}
									/>
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader
										label={t("people.reposTable.columns.language")}
									/>
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<PlainHeader
										label={t("people.reposTable.columns.openIssues")}
									/>
								</th>
								<th className="px-3 py-2 whitespace-nowrap">
									<SortHeader
										label={t("people.reposTable.columns.updated")}
										sortKey="updated"
										activeKey={sortKey}
										dir={sortDir}
										onSort={handleSort}
									/>
								</th>
							</tr>
						</thead>
						<tbody>
							{page.map((repo) => {
								const key = `${repo.owner}/${repo.name}`;
								const updatedAt = repo.lastUpdatedAt
									? formatDistanceToNowStrict(new Date(repo.lastUpdatedAt), {
											addSuffix: true,
										})
									: repo.lastUpdated || "—";
								return (
									<tr
										key={key}
										className="border-b last:border-b-0 hover:bg-muted/50"
									>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<Link
												to="/$username/$repo"
												params={{ username: repo.owner, repo: repo.name }}
												className="flex max-w-60 items-center gap-1.5 text-foreground hover:text-primary"
												title={key}
											>
												{repo.forked ? (
													<GitFork className="size-4 shrink-0 text-muted-foreground" />
												) : (
													<BookMarked className="size-4 shrink-0 text-muted-foreground" />
												)}
												<span className="truncate font-bold">{repo.name}</span>
											</Link>
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<OwnerHover
												username={repo.owner}
												person={peopleByName.get(repo.owner.toLowerCase())}
											/>
										</td>
										<td className="max-w-80 px-3 py-1.5">
											<div className="truncate text-muted-foreground">
												{repo.description || "—"}
											</div>
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											{repo.language ? (
												<div className="flex items-center gap-1.5">
													<div
														className="size-3 rounded-full"
														style={{
															backgroundColor: getLanguageColor(repo.language),
														}}
													/>
													<div className="text-foreground font-medium">
														{repo.language}
													</div>
												</div>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<OpenIssuesCell owner={repo.owner} repo={repo.name} />
										</td>
										<td className="px-3 py-1.5 whitespace-nowrap">
											<div className="text-muted-foreground">{updatedAt}</div>
										</td>
									</tr>
								);
							})}
							{page.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="px-3 py-10 text-center text-sm text-muted-foreground"
									>
										{t("people.reposTable.noMatch")}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Card>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-sm text-muted-foreground">
					{t("common.counts.showingOf", {
						from: rangeStart,
						to: rangeEnd,
						total: sorted.length,
					})}
				</p>
				<div className="flex items-center gap-2">
					<select
						aria-label={t("common.actions.rowsPerPage")}
						value={pageSize}
						onChange={(e) => {
							setPageSize(Number(e.target.value));
							setPageIndex(0);
						}}
						className="rounded-md border border-border bg-background px-2 py-1 text-sm"
					>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>
								{t("common.counts.perPage", { size })}
							</option>
						))}
					</select>
					<Button
						variant="outline"
						size="icon-sm"
						disabled={safePageIndex === 0}
						onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
						aria-label={t("common.actions.previousPage")}
					>
						<ChevronLeft />
					</Button>
					<span className="text-sm text-muted-foreground">
						{t("common.counts.pageIndicator", {
							page: safePageIndex + 1,
							total: pageCount,
						})}
					</span>
					<Button
						variant="outline"
						size="icon-sm"
						disabled={safePageIndex >= pageCount - 1}
						onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
						aria-label={t("common.actions.nextPage")}
					>
						<ChevronRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
