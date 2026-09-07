import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Badge } from "#/components/ui/badge"
import {
  ChevronDown,
  Ellipsis,
  Eye,
  FoldHorizontal,
  TriangleAlert,
} from "lucide-react"
import { timeAgo } from "@/lib/time-ago"

import type {
  ConversationComment,
  ConversationCommit,
  ConversationReview,
} from "./types/conversation"
import { Input } from "#/components/ui/input"
import { Button } from "#/components/ui/button"

export default function CommentItem({
  username,
  avatarLink,
  comment,
  date,
}: Omit<ConversationComment, "type">) {
  return (
    <div className="group flex w-full flex-row gap-4">
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
              <span className="text-xs underline">
                {timeAgo(date)}
              </span>
            </span>
          </div>

          {/* Comment actions */}
          <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Comment actions"
                >
                  <Ellipsis size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="right"
                align="start"
                className="min-w-44"
              >
                <DropdownMenuItem>
                  Copy link
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Copy Markdown
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Quote Reply
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Reference in new issue
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  Hide
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem variant="destructive">
                  Delete
                </DropdownMenuItem>
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
    <div className="ml-13 flex flex-row items-center gap-2 text-sm">
      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 1024 640"
        >
          <path
            fill="currentColor"
            d="M960 384H826q-23 110-111 183t-203 73t-203-73t-111-183H64q-27 0-45.5-19T0 319.5t18.5-45T64 256h134q23-111 111-183.5T512 0t203 72.5T826 256h134q27 0 45.5 18.5t18.5 45t-18.5 45.5T960 384M512 128q-80 0-136 56t-56 136t56 136t136 56t136-56t56-136t-56-136t-136-56"
          />
        </svg>
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

      <p className="truncate font-mono text-xs text-muted-foreground underline underline-offset-2">
        {message}
      </p>

      <span className="ml-auto cursor-pointer font-mono text-xs text-muted-foreground hover:underline">
        {hash}
      </span>
    </div>
  )
}


type ReviewItemMSGProps = Omit<ConversationReview, "type"> & {
  isAuthor?: boolean
}

export function ReviewItemMSG({
  username,
  avatarLink,
  date,
  filePath,
  isOutdated,
  isAuthor = false,
}: ReviewItemMSGProps) {
  const [isResolved, setIsResolved] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!isOutdated)
  const [showAllComments, setShowAllComments] = useState(false)

  const isDisabled = isOutdated || isResolved

  const toggleExpanded = () => {
    setIsExpanded((value) => !value)
  }

  const toggleResolved = () => {
    const nextResolved = !isResolved

    setIsResolved(nextResolved)

    if (nextResolved) {
      setIsExpanded(false)
    } else {
      setIsExpanded(true)
    }
  }

  const notes = [
    {
      username: "thefoxcost",
      avatar:
        "https://api.dicebear.com/10.x/sprouts/svg?seed=i5rw5xmn",
      message:
        "Consider using the logger instead of console.log here.",
    },
    {
      username: "alice",
      avatar:
        "https://api.dicebear.com/10.x/sprouts/svg?seed=9p1b8wb2",
      message:
        "Could we extract this into a reusable function?",
    },
    {
      username: "bob",
      avatar:
        "https://api.dicebear.com/10.x/sprouts/svg?seed=4q5xhvgl",
      message:
        "This condition can probably be simplified.",
    },
    {
      username: "charlie",
      avatar:
        "https://api.dicebear.com/10.x/sprouts/svg?seed=46ocup8i",
      message:
        "Please add a test case for this behavior.",
    },
    {
      username: "david",
      avatar:
        "https://api.dicebear.com/10.x/shapes/svg?seed=w81z4jq7",
      message:
        "Looks good overall, but I would rename this variable.",
    },
  ]

  return (
    <div className="group ml-13 flex flex-col">
      {/* Review author */}
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

        <span className="font-semibold">{username}</span>

        <span className="text-xs text-muted-foreground underline underline-offset-2">
          {timeAgo(date)}
        </span>
      </div>

      <div className="mt-2 ml-9">
        {/* Review header */}
        <div
          className={`border border-foreground/10 bg-accent/40 p-1 ${isExpanded ? "rounded-t-sm" : "rounded-sm"
            }`}
        >
          <div className="flex flex-row items-center gap-2 text-sm">
            {/* Expand / collapse */}
            <div
              onClick={toggleExpanded}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              role="button"
              tabIndex={0}
              aria-label={
                isExpanded ? "Collapse review" : "Expand review"
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault()
                  toggleExpanded()
                }
              }}
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"
                  }`}
              />
            </div>

            {/* File path */}
            <div
              onClick={toggleExpanded}
              className={`truncate font-mono text-xs ${isDisabled
                ? "cursor-default opacity-50"
                : "cursor-pointer hover:text-blue-400 hover:underline"
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

            <div className="ml-auto mr-1 flex items-center gap-2">
              {/* Show / Hide Resolved
                  Only shown when resolved.
                  NEVER disabled. */}
              {isResolved && (
                <div
                  onClick={toggleExpanded}
                  className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <FoldHorizontal size={14} />

                  {isExpanded
                    ? "Hide Resolved"
                    : "Show Resolved"}
                </div>
              )}

              {/* Show / hide all comments
                  NEVER disabled. */}
              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllComments((value) => !value)
                  }
                  className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={
                    showAllComments
                      ? "Hide comments"
                      : "Show all comments"
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M9 22a1 1 0 0 1-1-1v-3H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.1l-3.7 3.71c-.2.19-.45.29-.7.29zm8-11V9h-2v2zm-4 0V9h-2v2zm-4 0V9H7v2z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review content */}
        {isExpanded && (
          <div
            className={`overflow-x-auto rounded-b-sm border border-foreground/20 border-t-0 ${isDisabled
              ? "select-none"
              : ""
              }`}
          >
            {/* Disabled review area */}
            <div
              className={
                isDisabled
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            >
              {/* Diff */}
              <div className="min-w-max font-mono text-xs">
                {/* Hunk */}
                <div className="flex min-h-7 items-center bg-muted/30 px-2 text-muted-foreground">
                  <span className="whitespace-pre">
                    @@ -10,7 +10,7 @@
                  </span>
                </div>

                {/* Line 10 */}
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

                {/* Line 12 */}
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

              {/* Review notes */}
              <div className="border-t border-foreground/10 px-2 py-1.5">
                {notes.map((note, index) => {
                  if (index > 0 && !showAllComments) {
                    return null
                  }

                  const isRoot = index === 0
                  const isLastVisible =
                    index === notes.length - 1 || !showAllComments

                  return (
                    <div
                      key={index}
                      className="group/note relative"
                    >
                      {/* Thread line */}
                      {!isLastVisible && (
                        <div className="absolute bottom-0 left-[11px] top-0 w-px bg-foreground/10" />
                      )}

                      <div className="relative flex items-start gap-2 py-1">
                        <Avatar className="size-5 shrink-0">
                          <AvatarImage src={note.avatar} />
                          <AvatarFallback className="text-[9px]">
                            {note.username
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          {/* Meta line */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold leading-none">
                              {note.username}
                            </span>

                            {note.username === username &&
                              isAuthor && (
                                <span className="font-normal text-muted-foreground">
                                  (Author)
                                </span>
                              )}

                            <span className="text-[11px] text-muted-foreground">
                              {isRoot ? "commented" : "replied"}
                            </span>
                            <div className="opacity-0 transition-opacity group-hover/note:opacity-100">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Comment actions"
                                  >
                                    <Ellipsis size={14} />
                                  </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  side="right"
                                  align="start"
                                  className="min-w-50"
                                >
                                  <DropdownMenuItem>
                                    Copy Markdown
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    Quote Reply
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    Reference in new issue
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem>
                                    Hide
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem variant="destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {timeAgo(date)}
                            </span>


                          </div>

                          {/* Message */}
                          <p className="mt-0.5 text-sm leading-snug text-foreground/90">
                            {note.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Collapsed replies indicator */}
                {!showAllComments && notes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllComments(true)}
                    className="flex items-center gap-1.5 py-0.5 pl-7 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>
                      <span className="font-medium">
                        {notes.length - 1}
                      </span>{" "}
                      {notes.length - 1 === 1
                        ? "reply"
                        : "replies"}{" "}
                      hidden
                    </span>
                    <ChevronDown size={10} className="rotate-[-90deg]" />
                  </button>
                )}
              </div>

              {/* Reply */}
              <div className="flex flex-row items-center gap-2 border-y border-foreground/10 bg-accent/40 p-2 px-2">
                <Avatar size="sm">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>

                <Input
                  className="w-full"
                  placeholder="Reply..."
                />
              </div>
            </div>


            <div className="flex items-center px-3 py-3 gap-2">
              <Button
                variant="outline"
                onClick={toggleResolved}
              >
                {isResolved
                  ? "Unresolve Conversation"
                  : "Resolve Conversation"}
              </Button>
              <span className="text-muted-foreground">
                <span className="font-semibold">thefoxcost</span>{" "}
                marked this conversation as resolved.
              </span>
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
      this is conversation sheet
    </div>
  )
}




type MergeState = "checking" | "mergeable" | "conflicted"

type CheckAndMergeItemProps = {
  mergeState: MergeState
}

export function CheckAndMergeItem({
  mergeState,
}: CheckAndMergeItemProps) {
  const isChecking = mergeState === "checking"
  const isMergeable = mergeState === "mergeable"
  const isConflicted = mergeState === "conflicted"

  return (
    <div className="ml-9 group flex w-full flex-row gap-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg p-2 ${
          isMergeable
            ? "bg-green-500/10"
            : isConflicted
              ? "bg-red-500/10"
              : "bg-yellow-500/10"
        }`}
      >
        {isConflicted ? (
          <svg
            className="size-5 text-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M12 6h4a2 2 0 0 1 2 2v7M6 12v9M9 3L3 9m6 0L3 3" />
            <circle cx="18" cy="18" r="3" />
          </svg>
        ) : (
          <svg
            className="size-5 text-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="M384 224c-23.637 0-44.307 12.89-55.391 32H319c-42.464 0-79.99-17.904-111.535-53.214-20.356-22.787-33.493-48.869-37.856-58.218C183.301 132.822 192 115.413 192 96c0-35.29-28.71-64-64-64S64 60.71 64 96c0 23.637 12.89 44.307 32 55.391V360.61C76.89 371.693 64 392.363 64 416c0 35.29 28.71 64 64 64s64-28.71 64-64c0-23.637-12.89-44.307-32-55.391V245.692C203.553 294.307 258.468 320 319 320h9.609c11.084 19.11 31.754 32 55.391 32 35.29 0 64-28.71 64-64s-28.71-64-64-64zM128 64c17.673 0 32 14.327 32 32s-14.327 32-32 32-32-14.327-32-32 14.327-32 32-32zm0 384c-17.673 0-32-14.327-32-32s14.327-32 32-32 32 14.327 32 32-14.327 32-32 32zm256-128c-17.673 0-32-14.327-32-32s14.327-32 32-32 32 14.327 32 32-14.327 32-32 32z"
            />
          </svg>
        )}
      </div>

      <div
        className={`flex flex-col overflow-hidden rounded-md border ${
          isMergeable
            ? "border-green-500/40"
            : isConflicted
              ? "border-red-500/40"
              : "border-yellow-500/40"
        }`}
      >
        <div className="flex items-center gap-2 p-4 w-[860px]">
          {isChecking ? (
            <svg
              className="size-10 shrink-0 text-yellow-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
          ) : isMergeable ? (
            <svg
              className="size-11 shrink-0 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.293-1.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"
              />
            </svg>
          ) : (
            <svg
              className="size-10 shrink-0 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m3.535 6.465a1 1 0 0 0-1.414 0L12 10.585l-2.121-2.12a1 1 0 1 0-1.414 1.414L10.585 12l-2.12 2.121a1 1 0 1 0 1.414 1.414L12 13.415l2.121 2.12a1 1 0 1 0 1.414-1.414L13.415 12l2.12-2.121a1 1 0 0 0 0-1.414"
              />
            </svg>
          )}

          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold">
              {isChecking
                ? "Checking mergeability"
                : isMergeable
                  ? "No conflicts with base branch"
                  : "Conflicts with base branch"}
            </span>

            <span
              className={`text-sm ${
                isConflicted ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {isChecking
                ? "Checking whether this pull request can be merged."
                : isMergeable
                  ? "Merging can be performed automatically."
                  : "This pull request cannot be merged until the conflicts are resolved."}
            </span>
          </div>
        </div>

        <div className="flex flex-row items-center bg-accent/60 p-3">
          <Button
            variant="default"
            disabled={!isMergeable}
            className={
              isMergeable
                ? "w-fit bg-green-600 text-white hover:bg-green-700"
                : isConflicted
                  ? "w-fit bg-red-600 text-white"
                  : "w-fit bg-yellow-600 text-white"
            }
          >
            Merge pull request
          </Button>

          <span className="ml-3 text-xs text-muted-foreground">
            You can also merge this with the command line.
          </span>
        </div>
      </div>
    </div>
  )
}