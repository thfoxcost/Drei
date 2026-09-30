import {
  ChevronDown,
  FileArchive,
  FolderSearch,
  GitFork,
  GitPullRequest,
  Search,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Line, LineChart } from "recharts";
import { formatBytes } from "#/lib/format";
import { getLanguageColor } from "#/lib/language-color";
import { timeAgo } from "#/lib/time-ago";
import type { OrganizationRepo } from "#/types/organization";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";

function RepoCard({ repo, owner }: { repo: OrganizationRepo; owner: string }) {
  const { t } = useTranslation();
  const {
    name,
    description,
    visibility,
    forked,
    forkedFromOwner,
    forkedFromName,
    language,
    forks,
    openPRs,
    size,
    lastUpdatedAt,
    activity,
  } = repo;

  const displayLanguage = language ?? t("common.states.unknown");

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div>
            <Link
              to="/$username/$repo"
              params={{ username: owner, repo: name }}
              className="cursor-pointer text-base font-semibold hover:underline"
            >
              {name}
            </Link>

            <Badge variant="outline" className="ml-2 text-muted-foreground">
              {visibility
                ? t("repositories.visibility.public")
                : t("repositories.visibility.private")}
            </Badge>
          </div>

          {forked && forkedFromOwner && (
            <span className="text-xs text-muted-foreground">
              {t("repositories.filters.forkedFrom")}{" "}
              <span className="underline">
                {forkedFromOwner}/{forkedFromName}
              </span>
            </span>
          )}

          <span className="text-sm text-muted-foreground">
            {description || t("repo.sidebar.noDescription")}
          </span>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: getLanguageColor(displayLanguage) }}
              />
              <span>{displayLanguage}</span>
            </div>

            <div className="flex items-center gap-1">
              <GitFork size={15} />
              <span className="text-foreground">{forks.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1">
              <FileArchive size={15} />
              <span className="text-foreground">{formatBytes(size)}</span>
            </div>

            <div className="flex items-center gap-1">
              <GitPullRequest size={15} />
              <span className="text-foreground">
                {openPRs.toLocaleString()}
              </span>
            </div>

            <span>
              {t("repositories.filters.updated", {
                time: timeAgo(lastUpdatedAt),
              })}
            </span>
          </div>
        </div>

        <div className="hidden h-20 w-40 shrink-0 sm:block">
          <LineChart
            width={160}
            height={50}
            data={activity.map((value) => ({ value }))}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
      <FolderSearch className="text-muted-foreground" size={28} />

      <p className="text-sm font-medium">{t("repositories.empty")}</p>

      <p className="text-sm text-muted-foreground">
        {query
          ? t("repositories.nothingMatches", { query })
          : t("repositories.noRepositoriesYet")}
      </p>
    </div>
  );
}

type SortOption = "last-updated" | "name";

type TypeOption = "all" | "source" | "forked" | "public" | "private";

const SORT_OPTIONS: { value: SortOption; key: string }[] = [
  { value: "last-updated", key: "repositories.sort.lastUpdated" },
  { value: "name", key: "repositories.sort.name" },
];

const TYPE_OPTIONS: { value: TypeOption; key: string }[] = [
  { value: "all", key: "repositories.types.all" },
  { value: "source", key: "repositories.types.source" },
  { value: "forked", key: "repositories.types.forked" },
  { value: "public", key: "repositories.visibility.public" },
  { value: "private", key: "repositories.visibility.private" },
];

interface RepoListProps {
  owner: string;
  repos: OrganizationRepo[];
  isLoading: boolean;
  isError: boolean;
}

function RepoList({ owner, repos, isLoading, isError }: RepoListProps) {
  const { t } = useTranslation();
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
          (repo.language ?? "").toLowerCase().includes(q),
      );
    }

    switch (type ?? "all") {
      case "source":
        result = result.filter((repo) => !repo.forked);
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
    }

    if (language && language !== "all") {
      result = result.filter((repo) => repo.language === language);
    }

    const sorted = [...result];

    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort(
        (a, b) => Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt),
      );
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

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
        <FolderSearch className="text-muted-foreground" size={28} />

        <p className="text-sm font-medium">{t("repositories.empty")}</p>

        <p className="text-sm text-muted-foreground">
          {t("repositories.loadFailed")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center gap-2">
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
            {t("common.counts.results", { count: filtered.length })}
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
      </div>

      {filtered.length > 0 ? (
        <div className="divide-y rounded-md border">
          {filtered.map((repo) => (
            <RepoCard key={repo.name} repo={repo} owner={owner} />
          ))}
        </div>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
  );
}

export { RepoCard, RepoList };
