import {
  ChevronDown,
  CircleDot,
  FileArchive,
  FolderSearch,
  GitFork,
  GitPullRequest,
  Scale,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Line, LineChart } from "recharts";
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

type Repo = {
  name: string;
  description: string;
  visibility?: string;
  isFork?: boolean;
  forkedFrom?: string;
  language: string;
  languageColor: string;
  license: string;
  forks: string;
  stars: string;
  size: string;
  prs: string;
  updated: string;
  updatedAt: string;
  chartData: { value: number }[];
};

const repos: Repo[] = [
  {
    name: "node",
    description:
      'Primary source of truth for the Docker "Official Images" program',
    language: "Java",
    languageColor: "bg-amber-400",
    license: "Apache-2.0",
    forks: "1.2k",
    stars: "4.8k",
    size: "12.4 MB",
    prs: "18",
    updated: "Updated 2 days ago",
    updatedAt: "2026-09-20T10:00:00Z",
    chartData: [
      { value: 222 },
      { value: 97 },
      { value: 167 },
      { value: 242 },
      { value: 373 },
      { value: 301 },
      { value: 245 },
      { value: 409 },
      { value: 59 },
      { value: 261 },
      { value: 327 },
      { value: 292 },
      { value: 342 },
      { value: 137 },
      { value: 120 },
      { value: 138 },
      { value: 446 },
      { value: 364 },
      { value: 243 },
      { value: 89 },
      { value: 137 },
      { value: 224 },
      { value: 138 },
      { value: 387 },
      { value: 215 },
      { value: 75 },
      { value: 383 },
      { value: 122 },
      { value: 315 },
      { value: 454 },
    ],
  },
  {
    name: "drei-backend",
    description: "Go HTTP server powering the Drei git platform",
    language: "Go",
    languageColor: "bg-sky-400",
    license: "MIT",
    forks: "84",
    stars: "612",
    size: "3.1 MB",
    prs: "9",
    updated: "Updated 5 hours ago",
    updatedAt: "2026-09-22T05:00:00Z",
    chartData: [
      { value: 120 },
      { value: 180 },
      { value: 90 },
      { value: 240 },
      { value: 310 },
      { value: 200 },
      { value: 280 },
      { value: 150 },
      { value: 340 },
      { value: 220 },
      { value: 400 },
      { value: 260 },
    ],
  },
  {
    name: "drei-client",
    description: "TanStack Start client with React 19 and Tailwind",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    license: "MIT",
    forks: "56",
    stars: "430",
    size: "8.7 MB",
    prs: "12",
    updated: "Updated yesterday",
    updatedAt: "2026-09-21T12:00:00Z",
    chartData: [
      { value: 80 },
      { value: 140 },
      { value: 210 },
      { value: 170 },
      { value: 260 },
      { value: 320 },
      { value: 190 },
      { value: 350 },
      { value: 280 },
      { value: 410 },
      { value: 300 },
      { value: 370 },
    ],
  },
  {
    name: "git-http-proxy",
    description: "CGI passthrough proxy for git-http-backend",
    isFork: true,
    forkedFrom: "git/git",
    language: "C",
    languageColor: "bg-purple-400",
    license: "GPL-2.0",
    forks: "1.9k",
    stars: "7.2k",
    size: "45.2 MB",
    prs: "3",
    updated: "Updated 3 weeks ago",
    updatedAt: "2026-09-01T10:00:00Z",
    chartData: [
      { value: 300 },
      { value: 250 },
      { value: 280 },
      { value: 190 },
      { value: 220 },
      { value: 160 },
      { value: 240 },
      { value: 130 },
      { value: 200 },
      { value: 110 },
      { value: 180 },
      { value: 90 },
    ],
  },
  {
    name: "pg-migrate",
    description: "Lightweight schema migration tool for Postgres",
    language: "Python",
    languageColor: "bg-yellow-400",
    license: "BSD-3-Clause",
    forks: "210",
    stars: "1.5k",
    size: "1.2 MB",
    prs: "27",
    updated: "Updated 4 days ago",
    updatedAt: "2026-09-18T10:00:00Z",
    chartData: [
      { value: 60 },
      { value: 110 },
      { value: 95 },
      { value: 160 },
      { value: 140 },
      { value: 210 },
      { value: 180 },
      { value: 250 },
      { value: 230 },
      { value: 300 },
      { value: 270 },
      { value: 340 },
    ],
  },
  {
    name: "ui-kit",
    description: "Shared shadcn/ui components and design tokens for Drei",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    license: "MIT",
    forks: "12",
    stars: "98",
    size: "640 KB",
    prs: "5",
    updated: "Updated 1 week ago",
    updatedAt: "2026-09-15T10:00:00Z",
    chartData: [
      { value: 40 },
      { value: 70 },
      { value: 55 },
      { value: 90 },
      { value: 75 },
      { value: 120 },
      { value: 100 },
      { value: 140 },
      { value: 115 },
      { value: 160 },
      { value: 130 },
      { value: 180 },
    ],
  },
];

function RepoCard({ repo }: { repo: Repo }) {
  const {
    name,
    description,
    visibility = "Public",
    isFork = false,
    forkedFrom,
    language,
    languageColor,
    license,
    forks,
    stars,
    size,
    prs,
    updated,
    chartData,
  } = repo;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div>
            <span className="cursor-pointer text-base font-semibold hover:underline">
              {name}
            </span>

            <Badge variant="outline" className="ml-2 text-muted-foreground">
              {visibility}
            </Badge>
          </div>

          {isFork && forkedFrom && (
            <span className="text-xs text-muted-foreground">
              Forked from <span className="underline">{forkedFrom}</span>
            </span>
          )}

          <span className="text-sm text-muted-foreground">{description}</span>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={`size-3 rounded-full ${languageColor}`} />
              <span>{language}</span>
            </div>

            <div className="flex items-center gap-1">
              <Scale size={15} />
              <span>{license}</span>
            </div>

            <div className="flex items-center gap-1">
              <GitFork size={15} />
              <span className="text-foreground">{forks}</span>
            </div>

            <div className="flex items-center gap-1">
              <CircleDot size={15} />
              <span className="text-foreground">{stars}</span>
            </div>

            <div className="flex items-center gap-1">
              <FileArchive size={15} />
              <span className="text-foreground">{size}</span>
            </div>

            <div className="flex items-center gap-1">
              <GitPullRequest size={15} />
              <span className="text-foreground">{prs}</span>
            </div>

            <span>{updated}</span>
          </div>
        </div>

        <div className="hidden h-20 w-40 shrink-0 sm:block">
          <LineChart
            width={160}
            height={50}
            data={chartData}
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
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
      <FolderSearch className="text-muted-foreground" size={28} />

      <p className="text-sm font-medium">No repositories found</p>

      <p className="text-sm text-muted-foreground">
        {query ? `Nothing matches "${query}"` : "No repositories yet"}
      </p>
    </div>
  );
}

type SortOption = "last-updated" | "name" | "stars";

type TypeOption = "all" | "source" | "forked" | "public" | "private";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "last-updated", label: "Last updated" },
  { value: "name", label: "Name" },
  { value: "stars", label: "Stars" },
];

const TYPE_OPTIONS: { value: TypeOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "source", label: "Source" },
  { value: "forked", label: "Forked" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

function parseCount(value: string): number {
  const trimmed = value.trim().toLowerCase();
  const parsed = Number.parseFloat(trimmed);

  if (Number.isNaN(parsed)) return 0;

  return trimmed.endsWith("k") ? parsed * 1000 : parsed;
}

function RepoList() {
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
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = repos;

    if (q) {
      result = result.filter(
        (repo) =>
          repo.name.toLowerCase().includes(q) ||
          repo.description.toLowerCase().includes(q) ||
          repo.language.toLowerCase().includes(q),
      );
    }

    switch (type ?? "all") {
      case "source":
        result = result.filter((repo) => !repo.isFork);
        break;
      case "forked":
        result = result.filter((repo) => repo.isFork);
        break;
      case "public":
        result = result.filter(
          (repo) => (repo.visibility ?? "Public") !== "Private",
        );
        break;
      case "private":
        result = result.filter((repo) => repo.visibility === "Private");
        break;
    }

    if (language && language !== "all") {
      result = result.filter((repo) => repo.language === language);
    }

    const sorted = [...result];

    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "stars") {
      sorted.sort((a, b) => parseCount(b.stars) - parseCount(a.stars));
    } else {
      sorted.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    }

    return sorted;
  }, [query, sort, type, language]);

  const sortLabel =
    sort == null
      ? "Sort"
      : (SORT_OPTIONS.find((option) => option.value === sort)?.label ?? sort);

  const typeLabel =
    type == null
      ? "Type"
      : (TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type);

  const languageLabel =
    language == null ? "Languages" : language === "all" ? "All" : language;

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-52 flex-1">
          <InputGroupInput
            placeholder="Search repositories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <InputGroupAddon>
            <Search size={16} />
          </InputGroupAddon>

          <InputGroupAddon align="inline-end">
            {filtered.length} result
            {filtered.length === 1 ? "" : "s"}
          </InputGroupAddon>
        </InputGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-1.5"
              aria-label="Select Sort"
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
                  {option.label}
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
              aria-label="Select Type"
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
                  {option.label}
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
              aria-label="Select Languages"
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
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>

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
            <RepoCard key={repo.name} repo={repo} />
          ))}
        </div>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
  );
}

export { repos };
export type { Repo };
export { RepoCard, RepoList };
