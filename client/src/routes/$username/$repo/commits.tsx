import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { endOfDay, format, startOfDay } from "date-fns";
import {
	CalendarIcon,
	Check,
	ChevronDown,
	GitCommitHorizontal,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import CommitCard from "#/components/repo/commit-card";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { NoRepo } from "#/components/repo/norepo";
import { RefSwitcher } from "#/components/repo/ref-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Spinner } from "#/components/ui/spinner";
import { useRepoData } from "#/hooks/useRepoData";
import { absoluteDate } from "#/lib/time-ago";
import type { Commit } from "#/types/repo";
import { Separator } from "#/components/ui/separator";

const commitsSearchSchema = z.object({
	ref: z.string().optional(),
});

export const Route = createFileRoute("/$username/$repo/commits")({
	component: RouteComponent,
	validateSearch: commitsSearchSchema,
});

// Parses the API's date format, e.g. "2026-07-23 11:25:29 -0700 -0700",
// which JS's Date constructor cannot parse on its own.
function parseCommitDate(raw: string): Date | null {
  const match = raw
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*([+-]\d{4})/);

  if (!match) return null;

  const [, datePart, timePart, offset] = match;
  const offsetWithColon = `${offset.slice(0, 3)}:${offset.slice(3)}`;
  const parsed = new Date(`${datePart}T${timePart}${offsetWithColon}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function formatDateRange(range?: DateRange): string {
  if (!range?.from) return "Date";
  if (!range.to) return format(range.from, "MMM d, yyyy");
  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

interface UsersFilterProps {
  contributors: Contributor[];
  selected: string | undefined;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (username: string | undefined) => void;
}

function UsersFilter({
  contributors,
  selected,
  query,
  onQueryChange,
  onSelect,
}: UsersFilterProps) {
  const filteredContributors = contributors.filter((contributor) =>
    contributor.username.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4" />
          {selected ?? "Users"}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60">
        <DropdownMenuGroup>
          <Input
            placeholder="Search users"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              onSelect(undefined);
              onQueryChange("");
            }}
          >
            <span className="flex items-center gap-2">
              {!selected && <Check size={14} />}
              Any user
            </span>
          </DropdownMenuItem>

          {filteredContributors.map((contributor) => (
            <DropdownMenuItem
              key={contributor.id || contributor.username}
              onClick={() => {
                onSelect(contributor.username);
                onQueryChange("");
              }}
            >
              <span className="flex items-center gap-2">
                {selected === contributor.username && <Check size={14} />}
                <Avatar size="sm">
                  {contributor.avatar ? (
                    <AvatarImage
                      src={contributor.avatar}
                      alt={contributor.username}
                    />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(contributor.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-1">{contributor.username}</span>
              </span>
            </DropdownMenuItem>
          ))}

          {filteredContributors.length === 0 && (
            <DropdownMenuItem disabled>No users found</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DateFilterProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
}

function DateFilter({ value, onChange }: DateFilterProps) {
  const hasSelection = Boolean(value?.from);

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDateRange(value)}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />

          {hasSelection && (
            <div className="flex justify-end p-2 pt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {hasSelection && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear date filter"
          onClick={() => onChange(undefined)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function RouteComponent() {
	const { username, repo }: { username: string; repo: string } =
		Route.useParams();
	const { ref } = Route.useSearch();
	const navigate = useNavigate();

	const routerState = useRouterState();
	const isCommitDetail = routerState.location.pathname.startsWith(
		`/${username}/${repo}/commits/`,
	);

	const [user, setUser] = useState<string | undefined>();
	const [userQuery, setUserQuery] = useState("");
	const [dateRange, setDateRange] = useState<DateRange | undefined>();

	const { data, isLoading, isError } = useRepoData(username, repo, ref);

  const filteredCommits = useMemo(() => {
    if (!data) return [];

    const from = dateRange?.from
      ? startOfDay(dateRange.from).getTime()
      : undefined;
    const to = dateRange?.to ? endOfDay(dateRange.to).getTime() : undefined;
    const selectedUser = user?.toLowerCase();

    return data.commits.filter((commit) => {
      if (selectedUser && commit.author.toLowerCase() !== selectedUser) {
        return false;
      }

      if (from !== undefined || to !== undefined) {
        const timestamp = parseCommitDate(commit.date)?.getTime();

        if (timestamp === undefined) return false;
        if (from !== undefined && timestamp < from) return false;
        if (to !== undefined && timestamp > to) return false;
      }

      return true;
    });
  }, [data, user, dateRange]);

  // Group the filtered commits by their calendar date, newest first. A commit
  // whose date cannot be parsed is grouped under its raw/absolute label so it
  // is never dropped from the list.
  const groupedCommits = useMemo(() => {
    const groups: { dateKey: string; label: string; commits: Commit[] }[] = [];
    const byKey = new Map<
      string,
      { dateKey: string; label: string; commits: Commit[] }
    >();

    for (const commit of filteredCommits) {
      const parsed = parseCommitDate(commit.date);
      const date = parsed ?? new Date(commit.date);
      const valid = !Number.isNaN(date.getTime());

      const dateKey = valid ? format(date, "yyyy-MM-dd") : `raw:${commit.date}`;
      const label = valid
        ? `Commits on ${format(date, "MMM d, yyyy")}`
        : `Commits on ${absoluteDate(commit.date)}`;

      let group = byKey.get(dateKey);

      if (!group) {
        group = { dateKey, label, commits: [] };
        byKey.set(dateKey, group);
        groups.push(group);
      }

      group.commits.push(commit);
    }

    return groups;
  }, [filteredCommits]);

  if (isCommitDetail) {
    return <Outlet />;
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <NoRepo />;
  }

	const branches = data.branches ?? [];
	const tags = data.tags ?? [];
	const defaultBranch = data.defaultBranch ?? "main";
	const currentBranch = ref ?? defaultBranch;
	const currentKind = branches.includes(currentBranch) ? "branch" : "tag";
	const contributors = data.contributors ?? [];

	const selectRef = (selected: string | undefined) => {
		navigate({
			search: selected ? { ref: selected } : {},
		});
	};

  const avatarForAuthor = (author: string) =>
    contributors.find((c) => c.username.toLowerCase() === author.toLowerCase())
      ?.avatar;

  return (
    <div className="mx-30 my-3">
      <h1 className="text-2xl">Commits</h1>
      <Separator className='my-2 mb-4' />

		<div className="my-2 flex flex-row items-center justify-between gap-2">
			<RefSwitcher
				currentRef={currentBranch}
				currentKind={currentKind}
				defaultBranch={defaultBranch}
				branches={branches}
				tags={tags}
				onSelectBranch={(selectedBranch) =>
					selectRef(
						selectedBranch === defaultBranch ? undefined : selectedBranch,
					)
				}
				onSelectTag={selectRef}
			/>

        <div className="flex flex-row items-center gap-2">
          <UsersFilter
            contributors={contributors}
            selected={user}
            query={userQuery}
            onQueryChange={setUserQuery}
            onSelect={(selectedUser) => {
              setUser(selectedUser);
              setUserQuery("");
            }}
          />

          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div>
        {groupedCommits.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No commits found matching the current filters.
          </p>
        ) : (
          <div className="space-y-[-4px]">
            {groupedCommits.map((group, index) => (
              <section key={group.dateKey} className="relative pl-7">
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 left-2.5 w-px bg-muted-foreground/40 ${index === 0 ? "top-8" : "top-1"}`}
                />

                <GitCommitHorizontal
                  aria-hidden="true"
                  className="absolute top-2 left-[-1.5px] size-6 rounded-full bg-background text-muted-foreground"
                />

                <p className="pt-2.5 text-sm text-muted-foreground">
                  {group.label}
                </p>

                <div className="mt-2">
                  {group.commits.length === 1 ? (
                    <div className="rounded-lg border">
                      <CommitCard
                        {...group.commits[0]}
                        avatar={avatarForAuthor(group.commits[0].author)}
                        owner={username}
                        repo={repo}
                      />
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      {group.commits.map((commit) => (
                        <CommitCard
                          key={commit.hash}
                          {...commit}
                          avatar={avatarForAuthor(commit.author)}
                          owner={username}
                          repo={repo}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
