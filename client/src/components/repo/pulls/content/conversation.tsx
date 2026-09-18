import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Ellipsis,
  Eye,
  EyeOff,
  FoldHorizontal,
  GitCommit,
  ImagePlus,
  Pencil,
  Settings,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "#/components/repo/issues/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Switch } from "#/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { useRepoData } from "#/hooks/useRepoData";
import type { PullRequest } from "#/types/prs";
import { timeAgo } from "@/lib/time-ago";
import type {
  ConversationComment,
  ConversationCommit,
  ConversationMerged,
  ConversationOpened,
  ConversationPush,
  ConversationReview,
  ConversationStateChange,
} from "./types/conversation";

function linkifyIssueRefs(
  content: string,
  username: string,
  repo: string,
): string {
  return content.replace(
    /#(\d+)\b/g,
    `[#$1](/${username}/${repo}/issues/$1)`,
  );
}

export default function CommentItem({
  commentId,
  username,
  avatarLink,
  comment,
  date,
  isAuthor,
  onEdit,
  onDelete,
  onQuoteReply,
  issueBasePath,
}: Omit<ConversationComment, "type">) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment);
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function handleSave() {
    if (!onEdit || !editBody.trim()) return;
    setSaving(true);
    try {
      onEdit(commentId, editBody);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(comment);
    toast.success("Markdown copied");
  }

  function handleQuoteReply() {
    const quoted = comment
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    onQuoteReply?.(`${quoted}\n\n`);
  }

  return (
    <div
      className={`group flex w-full flex-row gap-4 ${hidden ? "opacity-50" : ""}`}
    >
      <Avatar className="size-9">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="relative flex items-center rounded-b-none rounded-sm border border-foreground/30 bg-accent/50 p-1 pl-3">
          <div className="absolute left-[-8px] top-3 z-10 size-0 border-y-[7px] border-r-8 border-y-transparent border-r-foreground/30" />
          <div className="absolute left-[-7px] top-[14px] z-20 size-0 border-y-[6px] border-r-[7px] border-y-transparent border-r-accent/50" />

          <div className="flex items-center gap-2">
            {hidden && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                Hidden
              </Badge>
            )}
            <span className="relative z-30 font-semibold">{username}</span>
            <span className="relative z-30 text-muted-foreground">
              {" "}
              commented{" "}
              <span className="text-xs underline">{timeAgo(date)}</span>
            </span>
          </div>

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
                <DropdownMenuItem onClick={handleCopyMarkdown}>
                  Copy Markdown
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleQuoteReply}>
                  Quote Reply
                </DropdownMenuItem>

                <DropdownMenuItem>Reference in new issue</DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setHidden((h) => !h)}>
                  {hidden ? (
                    <>
                      <Eye size={14} />
                      Un-hide
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} />
                      Hide
                    </>
                  )}
                </DropdownMenuItem>

                {isAuthor && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setEditBody(comment);
                        setEditing(true);
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete?.(commentId)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!hidden && (
          <div className="rounded-b-sm border border-foreground/30 border-t-0 p-2">
            {editing ? (
              <div className="space-y-2">
                <Textarea
                  rows={4}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !editBody.trim()}
                  >
                    {saving ? <Spinner /> : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <Markdown
                content={
                  issueBasePath
                    ? linkifyIssueRefs(comment, issueBasePath.username, issueBasePath.repo)
                    : comment
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
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
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <span className="font-semibold">{username}</span>

      <p className="truncate font-mono text-xs text-muted-foreground underline underline-offset-2">
        {message}
      </p>

      <span className="ml-auto cursor-pointer font-mono text-xs text-muted-foreground hover:underline">
        {hash}
      </span>
    </div>
  );
}

type ReviewItemMSGProps = Omit<ConversationReview, "type"> & {
  isAuthor?: boolean;
};

export function ReviewItemMSG({
  username,
  avatarLink,
  date,
  filePath,
  isOutdated,
  isAuthor = false,
}: ReviewItemMSGProps) {
  const [isResolved, setIsResolved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isOutdated);
  const [showAllComments, setShowAllComments] = useState(false);

  const isDisabled = isOutdated || isResolved;

  const toggleExpanded = () => {
    setIsExpanded((value) => !value);
  };

  const toggleResolved = () => {
    const nextResolved = !isResolved;

    setIsResolved(nextResolved);

    if (nextResolved) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  const notes = [
    {
      username: "thefoxcost",
      avatar: "https://api.dicebear.com/10.x/sprouts/svg?seed=i5rw5xmn",
      message: "Consider using the logger instead of console.log here.",
    },
    {
      username: "alice",
      avatar: "https://api.dicebear.com/10.x/sprouts/svg?seed=9p1b8wb2",
      message: "Could we extract this into a reusable function?",
    },
    {
      username: "bob",
      avatar: "https://api.dicebear.com/10.x/sprouts/svg?seed=4q5xhvgl",
      message: "This condition can probably be simplified.",
    },
    {
      username: "charlie",
      avatar: "https://api.dicebear.com/10.x/sprouts/svg?seed=46ocup8i",
      message: "Please add a test case for this behavior.",
    },
    {
      username: "david",
      avatar: "https://api.dicebear.com/10.x/shapes/svg?seed=w81z4jq7",
      message: "Looks good overall, but I would rename this variable.",
    },
  ];

  return (
    <div className="group ml-13 flex flex-col">
      {/* Review author */}
      <div className="flex flex-row items-center gap-2 text-sm">
        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Eye size={17} />
        </div>

        <Avatar className="size-6">
          <AvatarImage src={avatarLink} />
          <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
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
              aria-label={isExpanded ? "Collapse review" : "Expand review"}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleExpanded();
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

                  {isExpanded ? "Hide Resolved" : "Show Resolved"}
                </div>
              )}

              {/* Show / hide all comments
                  NEVER disabled. */}
              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllComments((value) => !value)}
                  className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={
                    showAllComments ? "Hide comments" : "Show all comments"
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
            className={`overflow-x-auto rounded-b-sm border border-foreground/20 border-t-0 ${isDisabled ? "select-none" : ""
              }`}
          >
            {/* Disabled review area */}
            <div className={isDisabled ? "pointer-events-none opacity-50" : ""}>
              {/* Diff */}
              <div className="min-w-max font-mono text-xs">
                {/* Hunk */}
                <div className="flex min-h-7 items-center bg-muted/30 px-2 text-muted-foreground">
                  <span className="whitespace-pre">@@ -10,7 +10,7 @@</span>
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
                    return null;
                  }

                  return (
                    <div key={index} className="group/note relative px-1">
                      <div className="relative flex items-center gap-2 py-1">
                        <Avatar className="size-6 shrink-0">
                          <AvatarImage src={note.avatar} />
                          <AvatarFallback className="text-[9px]">
                            {note.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold leading-none">
                              {note.username.charAt(0).toUpperCase() +
                                note.username.slice(1)}
                            </span>

                            {note.username === username && isAuthor && (
                              <span className="font-normal text-muted-foreground">
                                (Author)
                              </span>
                            )}
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

                                  <DropdownMenuItem>Hide</DropdownMenuItem>

                                  <DropdownMenuItem>Edit</DropdownMenuItem>

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

                          <p className="text-xs leading-snug text-foreground/90">
                            {note.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Collapsed replies indicator */}
                {!showAllComments && notes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllComments(true)}
                    className="flex items-center gap-1.5 py-0.5 pl-7 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>
                      <span className="font-medium">{notes.length - 1}</span>{" "}
                      {notes.length - 1 === 1 ? "reply" : "replies"} hidden
                    </span>

                    <ChevronDown size={10} className="-rotate-90" />
                  </button>
                )}
              </div>

              {/* Reply */}
              <div className="flex flex-row items-center gap-2 border-y border-foreground/10 bg-accent/40 p-2 px-2">
                <Avatar size="sm">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>

                <Input className="w-full" placeholder="Reply..." />
              </div>
            </div>

            <div className="flex items-center px-3 py-3 gap-2">
              <Button variant="outline" onClick={toggleResolved}>
                {isResolved ? "Unresolve Conversation" : "Resolve Conversation"}
              </Button>
              <span className="text-muted-foreground">
                <span className="font-semibold">thefoxcost</span> marked this
                conversation as resolved.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type MergeState = "checking" | "mergeable" | "conflicted";

type CheckAndMergeItemProps = {
  mergeState: MergeState;
  disabled?: boolean;
};

export function CheckAndMergeItem({ mergeState, disabled = false }: CheckAndMergeItemProps) {
  const isChecking = mergeState === "checking";
  const isMergeable = mergeState === "mergeable";
  const isConflicted = mergeState === "conflicted";

  return (
    <div className="ml-9 group flex w-full flex-row gap-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg p-2 ${isMergeable
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
        className={`flex flex-col overflow-hidden rounded-md border ${isMergeable
          ? "border-green-500/40"
          : isConflicted
            ? "border-red-500/40"
            : "border-yellow-500/40"
          }`}
      >
        <div className="flex items-center gap-2 p-4 w-[880px]">
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
              className={`text-sm ${isConflicted ? "text-foreground" : "text-muted-foreground"
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

        <div
          className={`flex flex-row items-center bg-accent/60 p-3 border-t ${isMergeable
            ? "border-green-600"
            : isConflicted
              ? "border-red-600"
              : "border-yellow-600"
            }`}
        >
          <Button
            variant="default"
            disabled={!isMergeable || disabled}
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
  );
}

export function ConversationSheet({
  pull,
  username,
  repo,
  onUpdate,
}: {
  pull: PullRequest;
  username: string;
  repo: string;
  onUpdate: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: repoData } = useRepoData(username, repo);

  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [reviewerQuery, setReviewerQuery] = useState("");
  const [labelQuery, setLabelQuery] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isReviewerOpen, setIsReviewerOpen] = useState(false);
  const [isLabelOpen, setIsLabelOpen] = useState(false);

  const contributors = repoData?.contributors ?? [];

  const { data: repoLabels } = useQuery({
    queryKey: ["repo-labels", username, repo],
    queryFn: async (): Promise<
      { id: number; name: string; color: string | null }[]
    > => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/labels`,
      );
      if (!res.ok) throw new Error("Failed to fetch labels");
      const json = (await res.json()) as {
        labels?: { id: number; name: string; color: string | null }[];
      };
      return json.labels ?? [];
    },
  });

  const filteredAssignees = useMemo(() => {
    const query = assigneeQuery.trim().toLowerCase();
    const assignedIds = new Set(pull.assignees?.map((a) => a.id) ?? []);
    const pool = contributors.filter((c) => !assignedIds.has(c.id));
    if (!query) return pool;
    return pool.filter((c) => c.username.toLowerCase().includes(query));
  }, [contributors, assigneeQuery, pull.assignees]);

  const filteredReviewers = useMemo(() => {
    const query = reviewerQuery.trim().toLowerCase();
    const reviewerIds = new Set(pull.reviewers?.map((r) => r.id) ?? []);
    const pool = contributors.filter((c) => !reviewerIds.has(c.id));
    if (!query) return pool;
    return pool.filter((c) => c.username.toLowerCase().includes(query));
  }, [contributors, reviewerQuery, pull.reviewers]);

  const filteredLabels = useMemo(() => {
    const query = labelQuery.trim().toLowerCase();
    const linkedIds = new Set(pull.labels?.map((l) => l.id) ?? []);
    const pool = (repoLabels ?? []).filter((l) => !linkedIds.has(l.id));
    if (!query) return pool;
    return pool.filter((l) => l.name.toLowerCase().includes(query));
  }, [repoLabels, labelQuery, pull.labels]);

  const labelQueryHasExactMatch = useMemo(() => {
    const q = labelQuery.trim().toLowerCase();
    if (!q) return false;
    return (repoLabels ?? []).some((l) => l.name.toLowerCase() === q);
  }, [repoLabels, labelQuery]);

  const invalidateAndRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["pull", username, repo, pull.number],
    });
    queryClient.invalidateQueries({
      queryKey: ["repo-labels", username, repo],
    });
    onUpdate();
  }, [queryClient, username, repo, pull.number, onUpdate]);

  const setAssigneesMutation = useMutation({
    mutationFn: async (assignees: string[]) => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/assignee`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignees }),
        },
      );
      if (!res.ok) throw new Error("Failed to update assignees");
    },
    onSuccess: invalidateAndRefresh,
  });

  const setReviewersMutation = useMutation({
    mutationFn: async (reviewers: string[]) => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/reviewers`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewers }),
        },
      );
      if (!res.ok) throw new Error("Failed to update reviewers");
    },
    onSuccess: invalidateAndRefresh,
  });

  const setLabelsMutation = useMutation({
    mutationFn: async (labels: number[]) => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/labels`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labels }),
        },
      );
      if (!res.ok) throw new Error("Failed to update labels");
    },
    onSuccess: invalidateAndRefresh,
  });

  const createLabelMutation = useMutation({
    mutationFn: async ({
      name,
      color,
    }: {
      name: string;
      color: string;
    }): Promise<{ id: number; name: string; color: string }> => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/labels`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color }),
        },
      );
      if (!res.ok) throw new Error("Failed to create label");
      return res.json();
    },
  });

  const notificationsMutation = useMutation({
    mutationFn: async (notifications: boolean) => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/notifications`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notifications }),
        },
      );
      if (!res.ok) throw new Error("Failed to update notifications");
    },
    onSuccess: invalidateAndRefresh,
  });

  const assignees = pull.assignees ?? [];
  const reviewers = pull.reviewers ?? [];
  const labels = pull.labels ?? [];
  const participants = pull.participants ?? [];

  function removeAssignee(userId: string) {
    setAssigneesMutation.mutate(
      assignees.filter((a) => a.id !== userId).map((a) => a.id),
    );
  }

  function addAssignee(userId: string) {
    setAssigneesMutation.mutate([...assignees.map((a) => a.id), userId]);
    setAssigneeQuery("");
    setIsAssigneeOpen(false);
  }

  function removeReviewer(userId: string) {
    setReviewersMutation.mutate(
      reviewers.filter((r) => r.id !== userId).map((r) => r.id),
    );
  }

  function addReviewer(userId: string) {
    setReviewersMutation.mutate([...reviewers.map((r) => r.id), userId]);
    setReviewerQuery("");
    setIsReviewerOpen(false);
  }

  function removeLabel(labelId: number) {
    setLabelsMutation.mutate(
      labels.filter((l) => l.id !== labelId).map((l) => l.id),
    );
  }

  function addLabel(labelId: number) {
    setLabelsMutation.mutate([...labels.map((l) => l.id), labelId]);
    setLabelQuery("");
    setIsLabelOpen(false);
  }

  const labelColors = [
    "#d73a4a",
    "#0075ca",
    "#008672",
    "#e4e669",
    "#D876E3",
    "#cfd3d7",
    "#a2eeef",
    "#f9d0c4",
    "#7057ff",
    "#fbca04",
  ];

  function getNextLabelColor(): string {
    const existingColors = new Set(
      (repoLabels ?? []).map((l) => l.color?.toLowerCase()),
    );
    return (
      labelColors.find((c) => !existingColors.has(c.toLowerCase())) ??
      labelColors[Math.floor(Math.random() * labelColors.length)]
    );
  }

  function createAndAddLabel() {
    const name = labelQuery.trim();
    if (!name) return;

    const color = getNextLabelColor();

    createLabelMutation.mutate(
      { name, color },
      {
        onSuccess: (created) => {
          setLabelsMutation.mutate([
            ...labels.map((l) => l.id),
            created.id,
          ]);
          setLabelQuery("");
          setIsLabelOpen(false);
        },
      },
    );
  }

  return (
    <div className="w-[400px]">
      <div className="space-y-1">
        <DropdownMenu
          open={isAssigneeOpen}
          onOpenChange={setIsAssigneeOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-2 text-muted-foreground"
            >
              <span className="text-[13px] font-semibold">
                Assignees
              </span>
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[260px]">
            <div className="px-2 py-1">
              <Input
                placeholder="Search contributors..."
                value={assigneeQuery}
                onChange={(e) => setAssigneeQuery(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {filteredAssignees.length === 0
                ? "No contributors available"
                : "Contributors"}
            </DropdownMenuLabel>
            {filteredAssignees.map((contributor) => (
              <DropdownMenuItem
                key={contributor.id}
                onClick={() => addAssignee(contributor.id)}
                className="flex items-center gap-2"
              >
                <Avatar className="size-5">
                  <AvatarImage src={contributor.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {contributor.username
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {contributor.username}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {assignees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2">
            {assignees.map((assignee) => (
              <div
                key={assignee.id}
                className="flex items-center gap-1.5 rounded-md bg-muted/50 p-1 text-xs"
              >
                <Avatar className="size-5">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-[9px]">
                    {assignee.username
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {assignee.username}
                </span>
                <button
                  type="button"
                  onClick={() => removeAssignee(assignee.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {assignees.length === 0 && (
          <span className="px-2 text-[13px] text-muted-foreground">
            No one assigned
          </span>
        )}
      </div>

      <Separator className="my-2" />

      <div className="space-y-1">
        <DropdownMenu open={isLabelOpen} onOpenChange={setIsLabelOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-2 text-muted-foreground"
            >
              <span className="text-[13px] font-semibold">
                Labels
              </span>
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[260px]">
            <div className="px-2 py-1">
              <Input
                placeholder="Search labels..."
                value={labelQuery}
                onChange={(e) => setLabelQuery(e.target.value)}
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    labelQuery.trim() &&
                    !labelQueryHasExactMatch
                  ) {
                    createAndAddLabel();
                  }
                }}
              />
            </div>
            <DropdownMenuSeparator />
            {filteredLabels.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Labels
                </DropdownMenuLabel>
                {filteredLabels.map((label) => (
                  <DropdownMenuItem
                    key={label.id}
                    onClick={() => addLabel(label.id)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          label.color || "#6b7280",
                      }}
                    />
                    <span className="text-xs">
                      {label.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {labelQuery.trim() && !labelQueryHasExactMatch && (
              <>
                {filteredLabels.length > 0 && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={createAndAddLabel}
                  className="flex items-center gap-2 text-blue-500"
                  disabled={createLabelMutation.isPending}
                >
                  <span className="text-xs">
                    {createLabelMutation.isPending
                      ? "Creating..."
                      : `+ Add "${labelQuery.trim()}"`}
                  </span>
                </DropdownMenuItem>
              </>
            )}
            {filteredLabels.length === 0 &&
              !labelQuery.trim() && (
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  No labels available
                </DropdownMenuLabel>
              )}
          </DropdownMenuContent>
        </DropdownMenu>

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2">
            {labels.map((label) => (
              <div
                key={label.id}
                className="inline-flex items-center gap-1 rounded-full border px-1 text-xs font-medium"
                style={{
                  borderColor: `${label.color || "#6b7280"}60`,
                  backgroundColor: `${label.color || "#6b7280"}15`,
                  color: label.color || "#6b7280",
                }}
              >
                <span className="ml-1">{label.name}</span>
                <button
                  type="button"
                  onClick={() => removeLabel(label.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {labels.length === 0 && (
          <span className="px-2 text-[13px] text-muted-foreground">
            No labels
          </span>
        )}
      </div>

      <Separator className="my-2" />

      <div className="space-y-1">
        <DropdownMenu
          open={isReviewerOpen}
          onOpenChange={setIsReviewerOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-2 text-muted-foreground"
            >
              <span className="text-[13px] font-semibold">
                Reviewers
              </span>
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[260px]">
            <div className="px-2 py-1">
              <Input
                placeholder="Search contributors..."
                value={reviewerQuery}
                onChange={(e) => setReviewerQuery(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {filteredReviewers.length === 0
                ? "No contributors available"
                : "Contributors"}
            </DropdownMenuLabel>
            {filteredReviewers.map((contributor) => (
              <DropdownMenuItem
                key={contributor.id}
                onClick={() => addReviewer(contributor.id)}
                className="flex items-center gap-2"
              >
                <Avatar className="size-5">
                  <AvatarImage src={contributor.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {contributor.username
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {contributor.username}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {reviewers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2">
            {reviewers.map((reviewer) => (
              <div
                key={reviewer.id}
                className="flex items-center gap-1.5 rounded-md bg-muted/50 p-1 text-xs"
              >
                <Avatar className="size-5">
                  <AvatarImage src={reviewer.avatar} />
                  <AvatarFallback className="text-[9px]">
                    {reviewer.username
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {reviewer.username}
                </span>
                <button
                  type="button"
                  onClick={() => removeReviewer(reviewer.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {reviewers.length === 0 && (
          <span className="px-2 text-[13px] text-muted-foreground">
            No reviewers
          </span>
        )}
      </div>

      <Separator className="my-2" />

      <div className="px-2">
        <span className="text-[13px] font-medium">
          {participants.length} participant
          {participants.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2 mt-2">
          {participants.map((user) => (
            <Avatar key={user.id} className="size-7">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between px-2">
        <div className="space-y-0.5">
          <span className="text-[13px] font-semibold">Notifications</span>
          <p className="text-[12px] text-muted-foreground">
            Get notified about activity on this PR.
          </p>
        </div>
        <Switch
          checked={pull.notifications}
          onCheckedChange={(checked) =>
            notificationsMutation.mutate(checked)
          }
        />
      </div>
    </div>
  );
}

type CommentEditorProps = {
  placeholder?: string;
  disabled?: boolean;
  avatarLink?: string;
  username?: string;
  onSubmit?: (body: string) => void;
  defaultValue?: string;
  uploadUrl?: string;
  onClose?: (body: string) => void;
  onReopen?: () => void;
  isClosed?: boolean;
  isMerged?: boolean;
};

export function CommentEditor({
  placeholder = "Leave a comment...",
  disabled = false,
  avatarLink,
  username,
  onSubmit,
  defaultValue,
  uploadUrl,
  onClose,
  onReopen,
  isClosed = false,
  isMerged = false,
}: CommentEditorProps) {
  const [value, setValue] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
      setTab("write");
      textareaRef.current?.focus();
    }
  }, [defaultValue]);

  function handleSubmit() {
    if (!value.trim() || !onSubmit) return;
    onSubmit(value);
    setValue("");
  }

  async function handleClose() {
    if (!onClose) return;
    setClosing(true);
    try {
      onClose(value);
      setValue("");
    } finally {
      setClosing(false);
    }
  }

  function insertImageMarkdown(url: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setValue((prev) => prev + `![image](${url})`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insertion = `![image](${url})`;
    setValue(before + insertion + after);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      textarea.focus();
    }, 0);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !uploadUrl) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to upload image.");
        return;
      }

      insertImageMarkdown(data.url);
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="group ml-9 flex w-full flex-col gap-3">
      <div className="flex w-full flex-row gap-4">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={avatarLink} />
          <AvatarFallback>
            {username ? username.slice(0, 2).toUpperCase() : "??"}
          </AvatarFallback>
        </Avatar>

        <div className="flex w-full max-w-[890px] flex-col gap-1">
          <h1 className="text-base font-semibold">Add a comment</h1>
          <div className="w-full overflow-hidden rounded-lg border">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as "write" | "preview")}
            >
              <div className="flex items-center justify-between gap-2 border-b bg-muted/10 pr-1.5">
                <TabsList className="m-1 h-7 bg-transparent">
                  <TabsTrigger value="write" className="px-2.5 text-sm">
                    Write
                  </TabsTrigger>

                  <TabsTrigger value="preview" className="px-2.5 text-sm">
                    Preview
                  </TabsTrigger>
                </TabsList>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={disabled || uploading || !uploadUrl}
                  className="text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  <span>{uploading ? "Uploading..." : "Attach image"}</span>
                </Button>
              </div>

              <TabsContent value="write" className="m-0 p-0">
                <Textarea
                  ref={textareaRef}
                  rows={6}
                  className="max-h-auto resize-none rounded-none border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
                  placeholder={placeholder}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  disabled={disabled}
                />
              </TabsContent>

              <TabsContent value="preview" className="m-0 overflow-hidden">
                <div className="max-h-auto overflow-auto px-4 py-3">
                  {value.trim() ? (
                    <Markdown content={value} />
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Nothing to preview.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center justify-end gap-2 mt-2">
            {!isClosed && !isMerged && (
              <Button
                type="button"
                variant="outline"
                disabled={closing}
                onClick={handleClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-red-500"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <circle cx="6" cy="6" r="3" />
                  <path d="M6 9v12M21 3l-6 6m6 0l-6-6m3 8.5V15" />
                  <circle cx="18" cy="18" r="3" />
                </svg>

                {closing ? "Closing..." : value.trim() ? "Close with comment" : "Close Pull Request"}
              </Button>
            )}
            {isClosed && !isMerged && (
              <Button
                type="button"
                variant="outline"
                disabled={closing}
                onClick={onReopen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-fuchsia-600"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22 12c0 5.523-4.477 10-10 10a9.98 9.98 0 0 1-7.781-3.719L2 20.5v-6h6l-2.357 2.357A8 8 0 0 0 20 12zm-10-2a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-8a9.98 9.98 0 0 1 7.781 3.719L22 3.5v6h-6l2.357-2.357A8 8 0 0 0 4 12H2C2 6.477 6.477 2 12 2"
                  />
                </svg>
                Reopen pull request
              </Button>
            )}
            <Button
              type="button"
              disabled={disabled || !value.trim()}
              onClick={handleSubmit}
            >
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpenedEvent({
  username,
  avatarLink,
  date,
  sourceBranch,
  targetBranch,
}: Omit<ConversationOpened, "type">) {
  return (
    <div className="ml-13 flex flex-row items-center gap-2 text-sm">
      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      </div>

      <Avatar className="size-6">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <span className="font-semibold">{username}</span>

      <span className="text-muted-foreground">
        opened this pull request from{" "}
        <Badge size="sm" variant="outline">
          {sourceBranch}
        </Badge>{" "}
        into{" "}
        <Badge size="sm" variant="outline">
          {targetBranch}
        </Badge>
      </span>

      <span className="ml-auto text-xs text-muted-foreground">
        {timeAgo(date)}
      </span>
    </div>
  );
}

export function StateChangeEvent({
  username,
  avatarLink,
  date,
  oldState: _oldState,
  newState,
}: Omit<ConversationStateChange, "type">) {
  const isClose = newState === "closed";
  const label = isClose ? "closed" : "reopened";

  return (
    <div className="ml-13 flex flex-row items-center gap-2 text-sm">
      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {isClose ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="16 12 12 8 8 12" />
            <line x1="12" y1="16" x2="12" y2="8" />
          </svg>
        )}
      </div>

      <Avatar className="size-6">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <span className="font-semibold">{username}</span>

      <span className="text-muted-foreground">{label} this pull request</span>

      <span className="ml-auto text-xs text-muted-foreground">
        {timeAgo(date)}
      </span>
    </div>
  );
}

export function MergedEvent({
  username,
  avatarLink,
  date,
}: Omit<ConversationMerged, "type">) {
  return (
    <div className="ml-13 flex flex-row items-center gap-2 text-sm">
      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M6 21V9a9 9 0 0 0 9 9" />
        </svg>
      </div>

      <Avatar className="size-6">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <span className="font-semibold">{username}</span>

      <span className="text-muted-foreground">merged this pull request</span>

      <span className="ml-auto text-xs text-muted-foreground">
        {timeAgo(date)}
      </span>
    </div>
  );
}

export function PushEvent({
  username,
  avatarLink,
  date,
  commitCount,
  commits,
}: Omit<ConversationPush, "type">) {
  return (
    <div className="ml-13 flex flex-row items-start gap-2 text-sm">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <GitCommit className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={avatarLink} />
            <AvatarFallback>
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <span className="font-semibold">{username}</span>

          <span className="text-muted-foreground">
            {commitCount === 1
              ? "pushed 1 commit"
              : `pushed ${commitCount} commits`}
          </span>

          <span className="ml-auto text-xs text-muted-foreground">
            {timeAgo(date)}
          </span>
        </div>

        {commits.length > 0 && (
          <div className="mt-1.5 rounded-md border bg-muted/30 px-3 py-2">
            {commits.map((c) => (
              <div key={c.hash} className="flex items-center gap-2 text-xs">
                <code className="font-mono text-muted-foreground">
                  {c.hash.slice(0, 7)}
                </code>
                <span className="truncate">{c.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
