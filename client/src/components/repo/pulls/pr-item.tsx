import {
  ArrowRight,
  GitMerge,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";
import { Badge } from "#/components/reui/badge";
import { timeAgo } from "#/lib/time-ago";

interface PullRequestUser {
  id: string;
  username: string;
  avatar?: string | null;
}

interface PullRequestItemProps {
  number: number;
  title: string;
  description?: string;
  state: "open" | "closed" | "merged";
  author: PullRequestUser;
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  commentCount: number;
  repoLabel?: string;
  showAuthorAvatar?: boolean;
  onNavigate?: (number: number) => void;
}

function PullRequestItem({
  title,
  number,
  state,
  author,
  sourceBranch,
  targetBranch,
  createdAt,
  mergedAt,
  closedAt,
  commentCount,
  onNavigate,
}: PullRequestItemProps) {
  const isOpen = state === "open";
  const isClosed = state === "closed";
  const isMerged = state === "merged";

  return (
    // biome-ignore lint/a11y/useSemanticElements: presentational row wired to onNavigate, not a router link
    <div
      className="group flex cursor-pointer flex-row items-center gap-3 border-b p-3 transition-colors hover:bg-muted/50 last:border-b-0"
      role="link"
      tabIndex={0}
      onClick={() => onNavigate?.(number)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate?.(number);
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <GitPullRequest
              size={16}
              className="shrink-0 text-green-500"
            />
          ) : (
            <GitMerge
              size={16}
              className="shrink-0 text-purple-400"
            />
          )}

          <span className="text-base cursor-pointer truncate font-semibold hover:text-blue-400 hover:underline">
            {title}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-[13px] ml-6">#{number}</span>
          <span>·</span>

          <span>base:</span>

          <Badge variant="outline" size="sm">
            {targetBranch}
          </Badge>

          <ArrowRight className="size-3 shrink-0" />

          <span>branch:</span>

          <Badge size="sm" variant="outline">
            {sourceBranch}
          </Badge>

          <span>·</span>

          <span>
            {isMerged && mergedAt
              ? `${author.username} merged ${timeAgo(mergedAt)}`
              : isClosed && closedAt
                ? `${author.username} closed ${timeAgo(closedAt)}`
                : `${author.username} opened ${timeAgo(createdAt)}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {commentCount > 0 && (
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground"
            title={`${commentCount} comment${commentCount === 1 ? "" : "s"}`}
          >
            <MessageSquare size={14} />
            {commentCount}
          </span>
        )}
      </div>
    </div>
  );
}

export default PullRequestItem;

