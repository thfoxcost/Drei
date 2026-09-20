import {
  CircleCheck,
  CircleDot,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { timeAgo } from "#/lib/time-ago";
import type { IssueComment, IssueUser } from "#/types/issues";

interface IssueItemProps {
  id: number;
  number: number;
  title: string;
  description: string;
  state: "open" | "closed";
  author: IssueUser;
  assignees: IssueUser[];
  labels: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: IssueUser | null;
  dueDate: string | null;
  commentCount: number;
  comments?: IssueComment[];
  repoLabel?: string;
  showAuthorAvatar?: boolean;
  onNavigate?: (number: number) => void;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function IssueItem({
  title,
  number,
  state,
  author,
  assignees,
  labels,
  createdAt,
  closedAt,
  closedBy,
  commentCount,
  repoLabel,
  showAuthorAvatar,
  onNavigate,
}: IssueItemProps) {
  const closed = state === "closed";

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
          {closed ? (
            <CircleCheck
              size={18}
              className="shrink-0 text-muted-foreground"
            />
          ) : (
            <CircleDot
              size={18}
              className="shrink-0 text-green-500"
            />
          )}

          <span className="cursor-pointer truncate font-semibold hover:text-blue-400 hover:underline">
            {title}
          </span>

          {labels.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          {repoLabel ? (
            <span className="font-medium">{repoLabel} · </span>
          ) : null}
          #{number} ·{" "}
          {closed && closedAt
            ? `${closedBy?.username ?? "someone"} closed ${timeAgo(closedAt)}`
            : `${author.username} opened ${timeAgo(createdAt)}`}
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

        {assignees.slice(0, 2).map((assignee) => (
          <Avatar
            key={assignee.id}
            size="sm"
            className="transition-transform group-hover:scale-105"
            title={assignee.username}
          >
            {assignee.avatar ? (
              <AvatarImage
                src={assignee.avatar}
                alt={assignee.username}
              />
            ) : null}
            <AvatarFallback>
              {getInitials(assignee.username)}
            </AvatarFallback>
          </Avatar>
        ))}

        {showAuthorAvatar && (
          <Avatar size="sm" title={author.username}>
            {author.avatar ? (
              <AvatarImage
                src={author.avatar}
                alt={author.username}
              />
            ) : null}
            <AvatarFallback>
              {getInitials(author.username)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

export default IssueItem;
