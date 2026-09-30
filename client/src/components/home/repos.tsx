import { useTranslation } from "react-i18next";

("use client");

import { Link, useNavigate } from "@tanstack/react-router";
import * as linguistLanguages from "linguist-languages";
import {
	BookMarked,
	ChevronDown,
	FolderSearch,
	GitFork,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	Forks,
	LastUpdate,
	License,
	Prevlang,
	Stars,
} from "#/components/preview-details";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import type { Repo } from "#/hooks/useUserRepos";
import { Separator } from "../ui/separator";

function fallbackColor(name: string) {
	let hash = 0;

	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}

	const hue = Math.abs(hash) % 360;

	return `hsl(${hue}, 65%, 50%)`;
}

function getLanguageColor(name: string): string {
	const entry = (linguistLanguages as Record<string, { color?: string }>)[name];

	return entry?.color ?? fallbackColor(name);
}

interface RepoCardProps {
	repo: Repo;
}

function RepoCard({ repo }: RepoCardProps) {
	const { t } = useTranslation();
	return (
		<Link
			to="/$username/$repo"
			params={{ username: repo.owner, repo: repo.name }}
			className="group block cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30 hover:bg-muted/40"
		>
			<div className="space-y-1.5">
				<div className="flex items-center gap-2">
					{repo.forked ? (
						<GitFork size={18} className="shrink-0 text-muted-foreground" />
					) : (
						<BookMarked size={18} className="shrink-0 text-muted-foreground" />
					)}

					<span className="truncate text-lg font-semibold group-hover:underline">
						{repo.name}
					</span>

					<Badge variant="outline">
						{repo.visibility
							? t("repositories.visibility.public")
							: t("repositories.visibility.private")}
					</Badge>
				</div>

				{repo.forked && repo.forkedFromOwner && repo.forkedFromName && (
					<p className="text-xs text-muted-foreground">
						{t("repositories.filters.forkedFrom")}{" "}
						<Link
							to="/$username/$repo"
							params={{
								username: repo.forkedFromOwner,
								repo: repo.forkedFromName,
							}}
							className="hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{repo.forkedFromOwner}/{repo.forkedFromName}
						</Link>
					</p>
				)}

				<p className="text-sm text-muted-foreground">
					{repo.description || t("repo.sidebar.noDescription")}
				</p>

				<div className="flex flex-wrap gap-1.5">
					{repo.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>

				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">
					<Prevlang
						language={repo.language}
						color={getLanguageColor(repo.language)}
					/>

					<Stars count={repo.stars} />

					<Forks count={repo.forks} />

					<License license={repo.license} />

					<LastUpdate updated={repo.lastUpdated} />
				</div>
			</div>
		</Link>
	);
}

function EmptyState({ query }: { query: string }) {
	const { t } = useTranslation();
	return (
		<div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
			<FolderSearch className="text-muted-foreground" size={28} />

			<p className="text-sm font-medium">{t("repositories.empty")}</p>

			<p className="text-sm text-muted-foreground">
				{t("repositories.nothingMatches", { query })}
			</p>
		</div>
	);
}

type SortOption = "last-updated" | "name";

type TypeOption =
	| "all"
	| "source"
	| "forked"
	| "public"
	| "private"
	| "mirrored"
	| "archived";

const SORT_OPTIONS: { value: SortOption; key: string }[] = [
	{ value: "last-updated", key: "repositories.sort.lastUpdated" },
	{ value: "name", key: "repositories.sort.name" },
];

const TYPE_OPTIONS: { value: TypeOption; key: string; disabled?: boolean }[] = [
	{ value: "all", key: "repositories.types.all" },
	{ value: "source", key: "repositories.types.source" },
	{ value: "forked", key: "repositories.types.forked" },
	{ value: "public", key: "repositories.visibility.public" },
	{ value: "private", key: "repositories.visibility.private" },
	{ value: "mirrored", key: "repositories.types.mirrored" },
	{ value: "archived", key: "repositories.types.archived" },
];

interface ReposProps {
	repos: Repo[];
}

function Repos({ repos }: ReposProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<SortOption | null>(null);
	const [type, setType] = useState<TypeOption | null>(null);
	const [language, setLanguage] = useState<string | null>(null);

	const languages = useMemo(() => {
		const found = new Set<string>();

		for (const repo of repos) {
			if (repo.language) found.add(repo.language);
		}

		return Array.from(found).sort((a, b) => a.localeCompare(b));
	}, [repos]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();

		let result = repos;

		if (q) {
			result = result.filter(
				(repo) =>
					repo.name.toLowerCase().includes(q) ||
					repo.description.toLowerCase().includes(q) ||
					repo.tags.some((tag) => tag.toLowerCase().includes(q)) ||
					repo.language.toLowerCase().includes(q),
			);
		}

		switch (type ?? "all") {
			case "source":
				result = result.filter((repo) => !repo.forked && !repo.mirrored);
				break;
			case "forked":
				result = result.filter((repo) => repo.forked);
				break;
			case "public":
				result = result.filter((repo) => repo.visibility);
				break;
			case "private":
				result = result.filter((repo) => !repo.visibility);
				break;
			case "mirrored":
				result = result.filter((repo) => repo.mirrored);
				break;
			case "archived":
				result = result.filter((repo) => repo.archived);
				break;
		}

		if (language && language !== "all") {
			result = result.filter((repo) => repo.language === language);
		}

		const sorted = [...result];

		if (sort === "name") {
			sorted.sort((a, b) => a.name.localeCompare(b.name));
		} else {
			sorted.sort((a, b) => updatedTime(b) - updatedTime(a));
		}

		return sorted;
	}, [repos, query, sort, type, language]);

	const sortLabel =
		sort == null
			? t("repositories.sort.label")
			: t(
					SORT_OPTIONS.find((option) => option.value === sort)?.key ??
						"repositories.sort.label",
				);

	const typeLabel =
		type == null
			? t("repositories.filters.type")
			: t(
					TYPE_OPTIONS.find((option) => option.value === type)?.key ??
						"repositories.filters.type",
				);

	const languageLabel =
		language == null
			? t("repositories.filters.language")
			: language === "all"
				? t("repositories.types.all")
				: language;

	return (
		<div className="space-y-3 p-2">
			<h1 className="text-2xl">{t("repositories.heading")}</h1>
			<Separator className="my-2 mb-4" />
			<div className="flex flex-wrap items-center gap-2 mb-5">
				<InputGroup className="min-w-52 flex-1">
					<InputGroupInput
						placeholder={t("repositories.searchPlaceholder")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>

					<InputGroupAddon>
						<Search size={16} />
					</InputGroupAddon>

					<InputGroupAddon align="inline-end">
						{t("common.counts.results", {
							count: filtered.length,
						})}
					</InputGroupAddon>
				</InputGroup>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label={t("common.actions.selectSort")}
						>
							{sortLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={sort ?? "last-updated"}
							onValueChange={(value) => setSort(value as SortOption)}
						>
							{SORT_OPTIONS.map((option) => (
								<DropdownMenuRadioItem key={option.value} value={option.value}>
									{t(option.key)}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label={t("common.actions.selectType")}
						>
							{typeLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={type ?? "all"}
							onValueChange={(value) => setType(value as TypeOption)}
						>
							{TYPE_OPTIONS.map((option) => (
								<DropdownMenuRadioItem
									key={option.value}
									value={option.value}
									disabled={option.disabled}
								>
									{t(option.key)}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-1.5"
							aria-label={t("common.actions.selectLanguages")}
						>
							{languageLabel}
							<ChevronDown className="size-4 opacity-60" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuRadioGroup
							value={language ?? "all"}
							onValueChange={setLanguage}
						>
							<DropdownMenuRadioItem value="all">
								{t("repositories.types.all")}
							</DropdownMenuRadioItem>

							{languages.map((lang) => (
								<DropdownMenuRadioItem key={lang} value={lang}>
									{lang}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button onClick={() => navigate({ to: "/new" })} className="shrink-0">
					<BookMarked />
					{t("repositories.new")}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				{filtered.length > 0 ? (
					filtered.map((repo) => <RepoCard key={repo.name} repo={repo} />)
				) : (
					<EmptyState query={query} />
				)}
			</div>
		</div>
	);
}

function updatedTime(repo: Repo): number {
	const value = repo.lastUpdatedAt ?? repo.lastUpdated;

	const time = Date.parse(value);

	return Number.isNaN(time) ? 0 : time;
}

export default Repos;
