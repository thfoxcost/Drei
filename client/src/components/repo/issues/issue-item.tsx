import {
  CircleCheck,
  CircleDot,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { timeAgo } from "#/lib/time-ago";

interface IssueUser {
  id: string;
  username: string;
  avatar?: string | null;
}

interface IssueItemProps {
  number: number;
  title: string;
  state: "open" | "closed";
  author: IssueUser;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  assignees?: IssueUser[];
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
  createdAt,
  updatedAt,
  commentCount,
  assignees = [],
  onNavigate,
}: IssueItemProps) {
  const isOpen = state === "open";

  return (
    <div
      className="group flex cursor-pointer flex-row items-center gap-3 p-3 transition-colors hover:bg-muted/50"
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
            <CircleDot
              size={17}
              className="shrink-0 text-green-500"
            />
          ) : (
            <CircleCheck
              size={17}
              className="shrink-0 text-purple-400"
            />
          )}

          <span className="cursor-pointer truncate font-semibold hover:text-blue-400 hover:underline">
            {title}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">#{number}</span>

          <span>·</span>

          <span>
            {isOpen
              ? `${author.username} opened ${timeAgo(createdAt)}`
              : `${author.username} closed ${timeAgo(updatedAt)}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {commentCount > 0 && (
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground"
            title={`${commentCount} comment${commentCount === 1 ? "" : "s"}`}
          >
            <MessageSquare size={14} />
            {commentCount}
          </span>
        )}

        {assignees.length > 0 && (
          <div className="flex -space-x-1">
            {assignees.map((assignee) => (
              <Avatar
                key={assignee.id}
                size="sm"
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
          </div>
        )}

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
      </div>
    </div>
  );
}

export default IssueItem;
