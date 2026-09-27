import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookMarked,
  Check,
  CircleCheck,
  CircleDot,
  GitCommit,
  GitMerge,
} from "lucide-react";
import { useRef, useState } from "react";
import { useActivity } from "#/hooks/useActivity";
import type { ActivityItem } from "#/lib/activity";
import { absoluteDate, timeAgo } from "#/lib/time-ago";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";

function LatestActivity() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, userId, sessionPending } =
    useActivity(page);

  // A new logged-in user must never inherit the previous user's pagination:
  // reset to page 1 whenever the session identity changes.
  const prevUserId = useRef(userId);
  if (userId !== prevUserId.current) {
    prevUserId.current = userId;
    setPage(1);
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
  const showSpinner = sessionPending || (isLoading && items.length === 0);

  return (
    <div className="flex min-h-0 flex-col gap-3 p-2">
      <Separator />

      <div className="relative min-h-0">
        {showSpinner ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Failed to load activity
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Actions on your repositories will show up here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                last={index === items.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4 shrink-0">
          <PaginationContent className="mt-123">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={safePage === 1}
                className={
                  safePage === 1 ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: page numbers are stable identifiers
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={safePage === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={safePage === totalPages}
                className={
                  safePage === totalPages
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function ActivityRow({
  item,
  last = false,
}: {
  item: ActivityItem;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3 items-center pb-4 last:pb-0">
      {!last && (
        <div className="absolute left-[18px] top-0 -bottom-1 w-px bg-border" />
      )}

      <div className="relative z-10 shrink-0">
        <Avatar className="size-9">
          {item.actor.avatar && (
            <AvatarImage src={item.actor.avatar} alt={item.actor.username} />
          )}
          <AvatarFallback>{getInitials(item.actor.username)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <ActivityBody item={item} />
      </div>
    </div>
  );
}

function ActorName({ username }: { username: string }) {
  return <span className="font-semibold">{username}</span>;
}

function RepoLink({ owner, name }: { owner: string; name: string }) {
  return (
    <Link
      to="/$username/$repo"
      params={{ username: owner, repo: name }}
      className="font-semibold text-foreground hover:underline"
    >
      {owner}/{name}
    </Link>
  );
}

function IssueLink({
  owner,
  repo,
  number,
}: {
  owner: string;
  repo: string;
  number: number;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: `/${owner}/${repo}/issues/${number}` })}
      className="cursor-pointer font-semibold text-foreground hover:underline"
    >
      {owner}/{repo}#{number}
    </button>
  );
}

function PullLink({
  owner,
  repo,
  number,
}: {
  owner: string;
  repo: string;
  number: number;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: `/${owner}/${repo}/pulls/${number}` })}
      className="cursor-pointer font-semibold text-foreground hover:underline"
    >
      {owner}/{repo}#{number}
    </button>
  );
}

function CommitLink({
  owner,
  repo,
  sha,
}: {
  owner: string;
  repo: string;
  sha: string;
}) {
  const short = sha.length > 7 ? sha.slice(0, 7) : sha;
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: `/${owner}/${repo}/commits/${sha}` })}
      className="cursor-pointer font-mono text-xs text-muted-foreground hover:underline"
    >
      {short}
    </button>
  );
}

function Timestamp({ createdAt }: { createdAt: string }) {
  return (
    <span title={absoluteDate(createdAt)} className="whitespace-nowrap">
      {timeAgo(createdAt)}
    </span>
  );
}

function OpenedPullRequestIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <circle cx="5" cy="6" r="3" />
        <path d="M5 9v12M15 9l-3-3l3-3" />
        <path d="M12 6h5a2 2 0 0 1 2 2v3m0 4v6m3-3h-6" />
      </g>
    </svg>
  );
}

function ClosedPullRequestIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <circle cx="6" cy="6" r="3" />
        <path d="M6 9v12M21 3l-6 6m6 0l-6-6m3 8.5V15" />
        <circle cx="18" cy="18" r="3" />
      </g>
    </svg>
  );
}

function ActivityBody({ item }: { item: ActivityItem }) {
  const { owner, name } = item.repo;
  const iconClass = "ml-auto size-8 shrink-0 text-muted-foreground";

  switch (item.type) {
    case "repo_created":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0 text-[15px]">
            <ActorName username={item.actor.username} />{" "}
            <span className="text-muted-foreground">
              created repository <RepoLink owner={owner} name={name} />{" "}
              <Timestamp createdAt={item.createdAt} />
            </span>
          </div>
          <BookMarked className={iconClass} />
        </div>
      );
    case "issue_opened":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                opened issue{" "}
                <IssueLink
                  owner={owner}
                  repo={name}
                  number={item.number ?? 0}
                />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {item.title && (
              <div className="truncate text-sm text-muted-foreground">
                {item.title}
              </div>
            )}
          </div>
          <CircleDot className={iconClass} />
        </div>
      );
    case "issue_closed":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                closed issue{" "}
                <IssueLink
                  owner={owner}
                  repo={name}
                  number={item.number ?? 0}
                />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {item.title && (
              <div className="truncate text-sm text-muted-foreground">
                {item.title}
              </div>
            )}
          </div>
          <CircleCheck className={iconClass} />
        </div>
      );
    case "pr_opened":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                opened pull request{" "}
                <PullLink owner={owner} repo={name} number={item.number ?? 0} />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {item.title && (
              <div className="truncate text-sm text-muted-foreground">
                {item.title}
              </div>
            )}
          </div>
          <OpenedPullRequestIcon className={iconClass} />
        </div>
      );
    case "pr_merged":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                merged pull request{" "}
                <PullLink owner={owner} repo={name} number={item.number ?? 0} />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {item.title && (
              <div className="truncate text-sm text-muted-foreground">
                {item.title}
              </div>
            )}
          </div>
          <GitMerge className={iconClass} />
        </div>
      );
    case "pr_closed":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                closed pull request{" "}
                <PullLink owner={owner} repo={name} number={item.number ?? 0} />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {item.title && (
              <div className="truncate text-sm text-muted-foreground">
                {item.title}
              </div>
            )}
          </div>
          <ClosedPullRequestIcon className={iconClass} />
        </div>
      );
    case "pr_approved":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                approved pull request{" "}
                <PullLink owner={owner} repo={name} number={item.number ?? 0} />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {item.title && (
              <div className="truncate text-sm text-muted-foreground">
                {item.title}
              </div>
            )}
          </div>
          <Check className={iconClass} />
        </div>
      );
    case "push":
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[15px]">
              <ActorName username={item.actor.username} />{" "}
              <span className="text-muted-foreground">
                pushed a commit to <RepoLink owner={owner} name={name} />{" "}
                <Timestamp createdAt={item.createdAt} />
              </span>
            </div>
            {(item.sha || item.message) && (
              <div className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                {item.sha && (
                  <CommitLink owner={owner} repo={name} sha={item.sha} />
                )}
                {item.message && (
                  <span className="truncate">— {item.message}</span>
                )}
              </div>
            )}
          </div>
          <GitCommit className={iconClass} />
        </div>
      );
  }
}

export default LatestActivity;
