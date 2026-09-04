import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { ChevronDown, Ellipsis, Eye, FoldHorizontal, TriangleAlert } from "lucide-react"
import { timeAgo } from "@/lib/time-ago"

import type {
  ConversationComment,
  ConversationCommit,
  ConversationReview,
} from "./types/conversation"
import { useState } from "react"
import { Badge } from "#/components/ui/badge"

export default function CommentItem({
  username,
  avatarLink,
  comment,
  date,
}: Omit<ConversationComment, "type">) {
  return (
    <div className="flex flex-row gap-4 w-full">
      <Avatar className="size-9">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="relative flex items-center rounded-b-none rounded-sm border border-foreground/30 bg-accent/50 p-1 pl-3">
          <div className="absolute left-[-8px] top-3 z-10 size-0 border-y-[7px] border-r-8 border-y-transparent border-r-foreground/30" />
          <div className="absolute left-[-7px] top-[14px] z-20 size-0 border-y-[6px] border-r-[7px] border-y-transparent border-r-accent/50" />

          <div>
            <span className="relative z-30 font-semibold">
              {username}
            </span>

            <span className="relative z-30 text-muted-foreground">
              {" "}commented{" "}
              <span className="underline text-xs">
                {timeAgo(date)}
              </span>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Ellipsis size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="min-w-35">
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Copy Markdown</DropdownMenuItem>
                <DropdownMenuItem>Quote Reply</DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem>Edit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-b-sm border border-foreground/30 border-t-0 p-3">
          <p className="text-sm">{comment}</p>
        </div>
      </div>
    </div>
  )
}

export function CommitItemMSG({
  username,
  avatarLink,
  message,
  hash,
}: Omit<ConversationCommit, "type">) {
  return (
    <div className="flex flex-row items-center gap-2 text-sm ml-13">
      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 1024 640"
        >
          <path
            fill="currentColor"
            d="M960 384H826q-23 110-111 183t-203 73t-203-73t-111-183H64q-27 0-45.5-19T0 319.5t18.5-45T64 256h134q23-111 111-183.5T512 0t203 72.5T826 256h134q27 0 45.5 18.5t18.5 45t-18.5 45.5t-45.5 19M512 128q-80 0-136 56t-56 136t56 136t136 56t136-56t56-136t-56-136t-136-56"
          />
        </svg>
      </div>

      <Avatar className="size-6">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <span className="font-semibold">{username}</span>

      <p className="text-muted-foreground truncate font-mono text-xs underline underline-offset-2">
        {message}
      </p>

      <span className="text-xs text-muted-foreground font-mono hover:underline cursor-pointer ml-auto">
        {hash}
      </span>
    </div>
  )
}


export function ReviewItemMSG({
  username,
  avatarLink,
  date,
  filePath,
  isOutdated,
}: Omit<ConversationReview, "type">) {
  const [isExpanded, setIsExpanded] = useState(true)

  // this outdate state should be set based on the review status, for now it's hardcoded to false
  // the logic is if a new commit is pushed to the PR after the review and the reviewd line changed so i sett it as outdated.

  const toggleExpanded = () => {
    if (isOutdated) return

    setIsExpanded((value) => !value)
  }

  return (
    <div className="ml-13 flex flex-col">
      {/* Review header */}
      <div className="flex flex-row items-center gap-2 text-sm">
        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Eye size={17} />
        </div>

        <Avatar className="size-6">
          <AvatarImage src={avatarLink} />
          <AvatarFallback>
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <span className="font-semibold">
          {username}
        </span>

        <span className="text-muted-foreground text-xs underline underline-offset-2">
          {timeAgo(date)}
        </span>
      </div>

      <div className="mt-4 ml-9">
        {/* Review header */}
        <div className="rounded-t-sm border border-foreground/10 bg-accent/40 p-1">
          <div className="flex flex-row items-center gap-2 text-sm">
            {/* Expand / collapse */}
            <div
              onClick={toggleExpanded}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground ${
                isOutdated
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer transition-colors hover:bg-muted hover:text-foreground"
              }`}
              role="button"
              tabIndex={isOutdated ? -1 : 0}
              aria-disabled={isOutdated}
              aria-label={
                isOutdated
                  ? "Outdated review"
                  : isExpanded
                    ? "Collapse code"
                    : "Expand code"
              }
              onKeyDown={(event) => {
                if (isOutdated) return

                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  toggleExpanded()
                }
              }}
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  isExpanded
                    ? "rotate-0"
                    : "-rotate-90"
                }`}
              />
            </div>

            {/* File path */}
            <div
              onClick={toggleExpanded}
              className={`truncate font-mono text-xs ${
                isOutdated
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer transition-colors hover:text-blue-400 hover:underline"
              }`}
            >
              {filePath}
            </div>

            {/* Outdated */}
            {isOutdated && (
              <Badge
                variant="outline"
                className="ml-2 gap-1 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500"
              >
                <TriangleAlert size={12} />
                Outdated
              </Badge>
            )}

            {/* Resolved */}
            <div
              onClick={toggleExpanded}
              className={`ml-auto mr-2 flex items-center gap-1 text-xs ${
                isOutdated
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer text-muted-foreground hover:text-foreground"
              }`}
              role="button"
              tabIndex={isOutdated ? -1 : 0}
              aria-disabled={isOutdated}
              onKeyDown={(event) => {
                if (isOutdated) return

                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  toggleExpanded()
                }
              }}
            >
              <FoldHorizontal size={14} />

              {isExpanded
                ? "Hide Resolved"
                : "Show Resolved"}
            </div>
          </div>
        </div>

        {/* Review diff */}
        {isExpanded && (
          <div className="overflow-x-auto rounded-b-sm border border-foreground/20 border-t-0">
            <div className="min-w-max font-mono text-xs">
              {/* Diff hunk header */}
              <div className="flex min-h-7 items-center bg-muted/30 px-2 text-muted-foreground">
                <span className="whitespace-pre">
                  @@ -10,7 +10,7 @@
                </span>
              </div>

              {/* Unchanged line */}
              <div className="flex min-h-6">
                <span className="min-w-8 shrink-0 select-none px-1 text-center text-muted-foreground">
                  10
                </span>

                <span className="min-w-8 shrink-0 select-none px-1 text-center text-muted-foreground">
                  10
                </span>

                <span className="w-6 shrink-0 select-none text-center font-semibold text-muted-foreground">
                  {" "}
                </span>

                <code className="whitespace-pre px-2">
                  {"  const handleClick = () => {"}
                </code>
              </div>

              {/* Reviewed line */}
              <div className="flex min-h-6 bg-yellow-500/10">
                <span className="min-w-8 shrink-0 select-none bg-yellow-500/20 px-1 text-center text-yellow-700 dark:text-yellow-400">
                  11
                </span>

                <span className="min-w-8 shrink-0 select-none bg-yellow-500/20 px-1 text-center text-yellow-700 dark:text-yellow-400">
                  11
                </span>

                <span className="w-6 shrink-0 select-none text-center font-semibold text-yellow-600 dark:text-yellow-500">
                  {" "}
                </span>

                <code className="whitespace-pre px-2 text-yellow-800 dark:text-yellow-300">
                  {"  console.log('hello')"}
                </code>
              </div>

              {/* Unchanged line */}
              <div className="flex min-h-6">
                <span className="min-w-8 shrink-0 select-none px-1 text-center text-muted-foreground">
                  12
                </span>

                <span className="min-w-8 shrink-0 select-none px-1 text-center text-muted-foreground">
                  12
                </span>

                <span className="w-6 shrink-0 select-none text-center font-semibold text-muted-foreground">
                  {" "}
                </span>

                <code className="whitespace-pre px-2">
                  {"  return response.json()"}
                </code>
              </div>
            </div>

            {/* Review comment */}
            <div className="border-t border-foreground/10 bg-accent/30 p-3">
              <p className="text-sm text-muted-foreground">
                Consider using the logger instead of console.log here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ConversationSheet() {
  return (
    <div className="w-120">
      sd
    </div>
  )
}