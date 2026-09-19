import { Link } from "@tanstack/react-router";
import { Check, Code, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { timeAgo } from "#/lib/time-ago";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";

interface CommitCardProps {
  hash: string;
  message: string;
  author: string;
  date: string;
  avatar?: string | null;
  owner: string;
  repo: string;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function CommitCard({
  hash,
  message,
  author,
  date,
  avatar,
  owner,
  repo,
}: CommitCardProps) {
  const [copied, setCopied] = useState(false);
  const commitPath = `/${owner}/${repo}/commits/${hash}`;

  const parts = message.split("\n");
  const title = parts[0]?.trim() || "No commit message";
  const description = parts.slice(1).join("\n").trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <div className="group flex flex-row items-center gap-3 border-b py-2 px-3 transition-colors last:border-b-0 hover:bg-muted/50">

      <Avatar title={author}>
        {avatar ? <AvatarImage src={avatar} alt={author} /> : null}
        <AvatarFallback>{getInitials(author)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <Link
            to={commitPath}
            className="truncate text-base hover:underline font-semibold text-foreground"
            title={title}
          >
            {title}
          </Link>

          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0 cursor-default text-muted-foreground hover:text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m-5 0a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m-5 0A1.5 1.5 0 0 1 7.5 12A1.5 1.5 0 0 1 9 10.5a1.5 1.5 0 0 1 1.5 1.5A1.5 1.5 0 0 1 9 13.5M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.96.89 1.65.89H22a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"/></svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-md whitespace-pre-wrap text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {author} committed {timeAgo(date)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 font-mono text-xs text-muted-foreground"
          title={hash}
        >
          {hash.slice(0, 7)}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          title={copied ? "Copied" : "Copy commit hash"}
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>

        <Link
          to={commitPath}
          className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="View diff"
        >
          <Code className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default CommitCard;
