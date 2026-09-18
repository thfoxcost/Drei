"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { timeAgo } from "#/lib/time-ago"
import { Badge } from "#/components/ui/badge"
import { Separator } from "#/components/ui/separator"
import {
  Avatar,
  AvatarFallback,
} from "#/components/ui/avatar"
import { Checkbox } from "#/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "#/components/ui/input"
import { Markdown } from "#/components/repo/issues/markdown"

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Diff,
  Download,
  Ellipsis,
  Folder,
  GitCommitHorizontal,
  ImagePlus,
  ListChevronsDownUp,
  ListChevronsUpDown,
  PanelRightOpen,
  Search,
  SquareDot,
  SquareMinus,
  SquarePlus,
} from "lucide-react"

import {
  type TreeDataItem,
  TreeView,
} from "#/components/tree-view"

import CodeCommitBlock, {
  type FileDiff,
} from "../../commits/code-commit"

import { usePRChangedFiles } from "#/hooks/PRs/use-pr-changed-files"
import { usePRCommits } from "#/hooks/PRs/use-pr-commits"
import { usePullRequest } from "#/hooks/PRs/use-pull-request"
import { useCommitDetail } from "#/hooks/PRs/use-commit-detail"
import {
  usePRViewedFiles,
  useTogglePRViewedFile,
} from "#/hooks/PRs/use-pr-viewed-files"
import { authClient } from "#/lib/auth-client"
import { useQueryClient } from "@tanstack/react-query"
import { useMutation } from "@tanstack/react-query"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#/components/ui/tabs"

import { Textarea } from "#/components/ui/textarea"

import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireItem,
} from "@/components/ui/questionnaire"

/*
|--------------------------------------------------------------------------
| File icons
|--------------------------------------------------------------------------
*/

const extensionToIcon: Record<string, string> = {
  go: "go.svg",
  ts: "typescript.svg",
  tsx: "typescript.svg",
  js: "javascript.svg",
  jsx: "javascript.svg",
  py: "python.svg",
  rs: "rust.svg",
  java: "java.svg",
  rb: "ruby.svg",
  php: "php.svg",
  c: "c.svg",
  h: "c.svg",
  cpp: "cpp.svg",
  hpp: "cpp.svg",
  css: "css.svg",
  scss: "sass.svg",
  json: "json.svg",
  yaml: "yaml.svg",
  yml: "yaml.svg",
  html: "html.svg",
  md: "markdown.svg",
  mdx: "mdx.svg",
  sql: "database.svg",
  sh: "console.svg",
  bash: "console.svg",
  zsh: "console.svg",
  lock: "lock.svg",
  pdf: "pdf.svg",
}

const filenameToIcon: Record<string, string> = {
  Makefile: "makefile.svg",
  Dockerfile: "docker.svg",
  ".gitignore": "git.svg",
  ".gitmodules": "git.svg",
  "go.mod": "go-mod.svg",
  "go.sum": "go-mod.svg",
  "package.json": "npm.svg",
  "package-lock.json": "npm.svg",
  "tsconfig.json": "tsconfig.svg",
  "vite.config.ts": "vite.svg",
  "tailwind.config.ts": "tailwindcss.svg",
  "Cargo.toml": "rust.svg",
  "Cargo.lock": "rust.svg",
  "README.md": "readme.svg",
  "readme.md": "readme.svg",
  "CHANGELOG.md": "changelog.svg",
  LICENSE: "key.svg",
}

function getFileIconName(path: string): string {
  const parts = path.split("/")
  const fileName = parts[parts.length - 1]

  if (filenameToIcon[fileName]) {
    return filenameToIcon[fileName]
  }

  const dotIndex = fileName.lastIndexOf(".")

  if (dotIndex === -1) {
    return "file.svg"
  }

  const ext = fileName.slice(dotIndex + 1).toLowerCase()

  return extensionToIcon[ext] ?? "file.svg"
}

function makeFileIconComponent(
  svgName: string,
): React.ComponentType<{
  className?: string
}> {
  const Component = ({
    className,
  }: {
    className?: string
  }) => {
    const filtered = (className ?? "")
      .replace(/\bh-\d+\b/g, "")
      .replace(/\bw-\d+\b/g, "")
      .trim()

    return (
      <img
        src={`/icons/${svgName}`}
        alt=""
        className={`h-4.5 w-4.5 ${filtered}`}
        style={{
          filter: "grayscale(1)",
        }}
      />
    )
  }

  Component.displayName = `FileIcon(${svgName})`

  return Component
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

type ChangeStatus =
  | "added"
  | "changed"
  | "removed"

function getStatusIcon(status: ChangeStatus) {
  if (status === "added") {
    return SquarePlus
  }

  if (status === "changed") {
    return SquareDot
  }

  return SquareMinus
}

function getStatusColor(status: ChangeStatus) {
  if (status === "added") {
    return "text-green-600 dark:text-green-500"
  }

  if (status === "changed") {
    return "text-orange-500"
  }

  return "text-red-600 dark:text-red-500"
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function filePathToId(path: string) {
  return `diff-${path.replace(
    /[^a-zA-Z0-9]/g,
    "-",
  )}`
}

function getChangeStatus(action: string): ChangeStatus {
  if (action === "added") {
    return "added"
  }

  if (action === "removed") {
    return "removed"
  }

  return "changed"
}

/*
|--------------------------------------------------------------------------
| Circular progress
|--------------------------------------------------------------------------
*/

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
}

function CircularProgress({
  value,
  size = 16,
  strokeWidth = 2,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const offset =
    circumference -
    (value / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />

      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-fuchsia-600 transition-all duration-300 dark:stroke-fuchsia-500"
      />
    </svg>
  )
}

/*
|--------------------------------------------------------------------------
| File row
|--------------------------------------------------------------------------
*/

function FileRowLabel({
  fileName,
  status,
  checked,
  onCheckedChange,
}: {
  fileName: string
  status: ChangeStatus
  checked: boolean
  onCheckedChange: (
    checked: boolean,
  ) => void
}) {
  const StatusIcon = getStatusIcon(status)

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => {
          onCheckedChange(value === true)
        }}
        onClick={(event) => {
          event.stopPropagation()
        }}
        className="size-3.5 shrink-0"
        aria-label={`Mark ${fileName} as viewed`}
      />

      <span
        className={`min-w-0 flex-1 truncate ${checked
          ? "text-muted-foreground"
          : ""
          }`}
      >
        {fileName}
      </span>

      <StatusIcon
        className={`h-4 w-4 shrink-0 ${getStatusColor(
          status,
        )}`}
      />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Build file tree
|--------------------------------------------------------------------------
*/

function buildFileTree(
  files: FileDiff[],
  viewedFiles: Set<string>,
  onViewedChange: (
    path: string,
    checked: boolean,
  ) => void,
  onFileClick: (path: string) => void,
): TreeDataItem[] {
  const root: TreeDataItem[] = []

  const sorted = [...files].sort((a, b) =>
    a.path.localeCompare(b.path),
  )

  for (const file of sorted) {
    const parts = file.path.split("/")

    let current = root

    for (
      let i = 0;
      i < parts.length - 1;
      i++
    ) {
      const dirName = parts[i]

      let existing = current.find(
        (node) =>
          node.name === dirName &&
          !!node.children,
      )

      if (!existing) {
        existing = {
          id: parts
            .slice(0, i + 1)
            .join("/"),
          name: dirName,
          icon: Folder,
          children: [],
        }

        current.push(existing)
      }

      current = existing.children!
    }

    const fileName =
      parts[parts.length - 1]

    current.push({
      id: file.path,

      name: (
        <FileRowLabel
          fileName={fileName}
          status={getChangeStatus(
            file.action,
          )}
          checked={viewedFiles.has(
            file.path,
          )}
          onCheckedChange={(checked) =>
            onViewedChange(
              file.path,
              checked,
            )
          }
        />
      ) as unknown as string,

      icon: makeFileIconComponent(
        getFileIconName(file.path),
      ),

      onClick: () =>
        onFileClick(file.path),
    })
  }

  return root
}

/*
|--------------------------------------------------------------------------
| Review questionnaire
|--------------------------------------------------------------------------
*/

const reviewQuestionnaireItems = [
  {
    choices: [
      {
        description:
          "Leave feedback without approving or blocking the pull request.",
        label: "Comment",
        value: "comment",
      },
      {
        description:
          "Approve the pull request when everything looks good.",
        label: "Approve",
        value: "approve",
      },
      {
        description:
          "Block the pull request until the issues are fixed.",
        label: "Request changes",
        value: "request_changes",
      },
    ],
    description:
      "Choose what action you want to take on this review.",
    name: "review-action",
    required: true,
    title: "What do you want to do with this review?",
  },
] as const

/*
|--------------------------------------------------------------------------
| Changed files
|--------------------------------------------------------------------------
*/

function Changedfiles({
  owner,
  repo,
  pullNumber,
}: {
  owner: string
  repo: string
  pullNumber: number
}) {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()

  const { data: pr } = usePullRequest(
    owner,
    repo,
    pullNumber,
  )

  const isAuthor = session?.user.id === pr?.author.id

  const {
    data: filesData,
    isLoading: filesLoading,
  } = usePRChangedFiles(
    owner,
    repo,
    pullNumber,
  )

  const { data: prCommits } = usePRCommits(
    owner,
    repo,
    pr?.targetBranch ?? "",
    pr?.sourceBranch ?? "",
  )

  const commits = prCommits ?? []

  const [
    selectedCommitHash,
    setSelectedCommitHash,
  ] = React.useState<string | null>(null)

  const {
    data: selectedCommit,
    isLoading: commitLoading,
  } = useCommitDetail(
    owner,
    repo,
    selectedCommitHash ?? "",
  )

  const allFileDiffs =
    filesData?.diffs ?? []

  const fileDiffs =
    selectedCommitHash && selectedCommit
      ? selectedCommit.diffs
      : allFileDiffs

  const { data: viewedData } =
    usePRViewedFiles(
      owner,
      repo,
      pullNumber,
    )

  const toggleViewed =
    useTogglePRViewedFile(
      owner,
      repo,
      pullNumber,
    )

  const [
    viewedFiles,
    setViewedFiles,
  ] = React.useState<Set<string>>(
    new Set(),
  )

  React.useEffect(() => {
    if (viewedData?.viewedFiles) {
      setViewedFiles(
        new Set(
          viewedData.viewedFiles,
        ),
      )
    }
  }, [viewedData])

  const [search, setSearch] =
    React.useState("")

  const [
    showFileTree,
    setShowFileTree,
  ] = React.useState(true)

  const [
    allExpanded,
    setAllExpanded,
  ] = React.useState(true)

  const [
    expandGeneration,
    setExpandGeneration,
  ] = React.useState(0)

  const [
    reviewComment,
    setReviewComment,
  ] = React.useState("")

  const [
    reviewAction,
    setReviewAction,
  ] = React.useState<string | null>(null)

  const [
    reviewTab,
    setReviewTab,
  ] = React.useState<
    "write" | "preview"
  >("write")

  const reviewFileInputRef = React.useRef<HTMLInputElement>(null)
  const reviewTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [reviewUploading, setReviewUploading] = React.useState(false)

  function insertReviewImageMarkdown(url: string) {
    const textarea = reviewTextareaRef.current
    if (!textarea) {
      setReviewComment((prev) => prev + `![image](${url})`)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = reviewComment.slice(0, start)
    const after = reviewComment.slice(end)
    const insertion = `![image](${url})`
    setReviewComment(before + insertion + after)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length
      textarea.focus()
    }, 0)
  }

  async function handleReviewFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.")
      return
    }

    setReviewUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch(
        `http://localhost:3200/api/repos/${owner}/${repo}/pulls/images`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      )

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to upload image.")
        return
      }

      insertReviewImageMarkdown(data.url)
    } catch {
      toast.error("Failed to upload image.")
    } finally {
      setReviewUploading(false)
      if (reviewFileInputRef.current) reviewFileInputRef.current.value = ""
    }
  }

  /*
   * Mark file as viewed
   */

  const handleViewedChange = (
    path: string,
    checked: boolean,
  ) => {
    setViewedFiles((current) => {
      const next = new Set(current)

      if (checked) {
        next.add(path)
      } else {
        next.delete(path)
      }

      return next
    })

    toggleViewed.mutate({
      filePath: path,
      viewed: checked,
    })
  }

  /*
   * Scroll to diff
   */

  const scrollToDiff = (
    path: string,
  ) => {
    const element =
      document.getElementById(
        filePathToId(path),
      )

    if (!element) {
      return
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })

    element.classList.add(
      "bg-blue-500/10",
      "ring-1",
      "ring-blue-500/30",
    )

    window.setTimeout(() => {
      element.classList.remove(
        "bg-blue-500/10",
        "ring-1",
        "ring-blue-500/30",
      )
    }, 1500)
  }

  /*
   * Search files
   */

  const filteredFiles =
    React.useMemo(() => {
      const value = search
        .trim()
        .toLowerCase()

      if (!value) {
        return fileDiffs
      }

      return fileDiffs.filter((file) =>
        file.path
          .toLowerCase()
          .includes(value),
      )
    }, [search, fileDiffs])

  /*
   * Progress
   */

  const totalFiles =
    fileDiffs.length

  const viewedCount =
    viewedFiles.size

  const progress =
    totalFiles === 0
      ? 0
      : (viewedCount / totalFiles) *
      100

  /*
   * Expand / collapse
   */

  const expandAll = () => {
    setAllExpanded(true)

    setExpandGeneration(
      (value) => value + 1,
    )
  }

  const collapseAll = () => {
    setAllExpanded(false)

    setExpandGeneration(
      (value) => value + 1,
    )
  }

  /*
   * Download diff
   */

  const downloadDiff = () => {
    let content = ""

    for (const diff of fileDiffs) {
      content += `diff --git a/${diff.path} b/${diff.path}\n`
      content += `--- a/${diff.path}\n`
      content += `+++ b/${diff.path}\n`

      for (const hunk of diff.hunks) {
        content += `${hunk.header}\n`

        for (const line of hunk.lines) {
          const prefix =
            line.type === "added"
              ? "+"
              : line.type ===
                "removed"
                ? "-"
                : " "

          content += `${prefix}${line.content}\n`
        }
      }

      content += "\n"
    }

    const blob = new Blob(
      [content],
      {
        type: "text/plain",
      },
    )

    const url =
      URL.createObjectURL(blob)

    const anchor =
      document.createElement("a")

    anchor.href = url
    anchor.download =
      "commit.diff"

    anchor.click()

    URL.revokeObjectURL(url)
  }

  /*
   * Submit review
   */

  const submitReview = useMutation({
    mutationFn: async ({ state, body }: { state: string; body: string }) => {
      const res = await fetch(
        `http://localhost:3200/api/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, body }),
        },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit review")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Review submitted")
      queryClient.invalidateQueries({ queryKey: ["pull-reviews", owner, repo, pullNumber] })
      queryClient.invalidateQueries({ queryKey: ["pull", owner, repo, pullNumber] })
      setReviewComment("")
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleReviewSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const comment =
      reviewComment.trim()

    if (!reviewAction) {
      toast.error(
        "Please choose a review action.",
      )

      return
    }

    if (reviewAction === "comment" && !comment) {
      toast.error("Please add a comment.")
      return
    }

    submitReview.mutate({ state: reviewAction, body: comment })
  }

  if (filesLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <span className="text-sm">
          Loading changed files...
        </span>
      </div>
    )
  }

  if (
    selectedCommitHash &&
    commitLoading
  ) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <span className="text-sm">
          Loading commit diffs...
        </span>
      </div>
    )
  }

  if (
    allFileDiffs.length === 0 &&
    !selectedCommitHash
  ) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <span className="text-sm">
          No changes found.
        </span>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Toolbar */}

      <div className="flex w-full items-center justify-between bg-background">
        {/* Left */}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() =>
              setShowFileTree(
                (value) => !value,
              )
            }
          >
            <PanelRightOpen
              className={`size-4 transition-transform ${showFileTree
                ? ""
                : "rotate-180"
                }`}
            />

            <span className="sr-only">
              {showFileTree
                ? "Hide changed files"
                : "Show changed files"}
            </span>
          </Button>

          <div className="flex items-center gap-2">
            <Diff className="size-4 text-muted-foreground" />

            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-orange-500">
                {totalFiles} changed files
              </span>{" "}
              with{" "}
              <span className="font-semibold text-green-600 dark:text-green-500">
                {fileDiffs.reduce(
                  (
                    total,
                    file,
                  ) =>
                    total +
                    file.additions,
                  0,
                )}{" "}
                additions
              </span>{" "}
              and{" "}
              <span className="font-semibold text-red-600 dark:text-red-500">
                {fileDiffs.reduce(
                  (
                    total,
                    file,
                  ) =>
                    total +
                    file.deletions,
                  0,
                )}{" "}
                deletions
              </span>
            </span>
          </div>
        </div>

        {/* Right */}

        <div className="flex items-center gap-2">
          {/* Viewing progress */}

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-default items-center gap-1.5">
                <CircularProgress
                  value={progress}
                  size={16}
                  strokeWidth={2}
                />

                <span className="text-xs text-muted-foreground">
                  {viewedCount}{" "}
                  of{" "}
                  {totalFiles}
                </span>
              </div>
            </TooltipTrigger>

            <TooltipContent>
              <p>
                {viewedCount} of{" "}
                {totalFiles} files viewed
              </p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" />

          {/* More */}

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
              <Button
                variant="outline"
                size="icon"
              >
                <Ellipsis className="size-4" />

                <span className="sr-only">
                  More options
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-48"
            >
              <DropdownMenuItem
                onClick={
                  downloadDiff
                }
              >
                <Download className="mr-2 size-4" />
                Download diff files
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={
                  expandAll
                }
              >
                <ListChevronsUpDown className="mr-2 size-4" />
                Expand all files
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={
                  collapseAll
                }
              >
                <ListChevronsDownUp className="mr-2 size-4" />
                Collapse all files
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  const allPaths =
                    fileDiffs.map(
                      (f) => f.path,
                    )

                  setViewedFiles(
                    new Set(allPaths),
                  )

                  fetch(
                    `http://localhost:3200/api/repos/${owner}/${repo}/pulls/${pullNumber}/viewed`,
                    {
                      method:
                        "PUT",
                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                      credentials:
                        "include",
                      body: JSON.stringify(
                        {
                          files:
                            allPaths,
                        },
                      ),
                    },
                  )
                }}
              >
                Mark all as viewed
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setViewedFiles(
                    new Set(),
                  )

                  fetch(
                    `http://localhost:3200/api/repos/${owner}/${repo}/pulls/${pullNumber}/viewed`,
                    {
                      method:
                        "DELETE",
                      credentials:
                        "include",
                    },
                  )
                }}
              >
                Mark all as unviewed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Commits */}

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
              <Button
                variant="outline"
                size="icon"
              >
                <GitCommitHorizontal className="size-4" />

                <span className="sr-only">
                  Commits
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-[480px]"
            >
              <DropdownMenuItem
                onClick={() =>
                  setSelectedCommitHash(
                    null,
                  )
                }
                className="flex items-center justify-between"
              >
                <span className="font-medium">
                  Show all files
                </span>

                {!selectedCommitHash && (
                  <span className="text-xs text-muted-foreground">
                    selected
                  </span>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem className="flex cursor-default items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {commits.length}{" "}
                  commits
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {commits.map(
                (
                  commit,
                  index,
                ) => (
                  <React.Fragment
                    key={
                      commit.hash
                    }
                  >
                    <DropdownMenuItem
                      onClick={() =>
                        setSelectedCommitHash(
                          selectedCommitHash ===
                            commit.hash
                            ? null
                            : commit.hash,
                        )
                      }
                      className={`flex items-center gap-2 ${selectedCommitHash ===
                        commit.hash
                        ? "bg-accent"
                        : ""
                        }`}
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center">
                        {selectedCommitHash ===
                          commit.hash ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Avatar className="size-6">
                            <AvatarFallback>
                              {commit.author?.[0]?.toUpperCase() ??
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <span className="shrink-0 font-semibold">
                        {
                          commit.author
                        }
                      </span>

                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {
                          commit.message
                        }
                      </span>

                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {
                          commit.hash.slice(
                            0,
                            7,
                          )
                        }
                      </span>
                    </DropdownMenuItem>

                    {index <
                      commits.length -
                      1 && (
                        <DropdownMenuSeparator />
                      )}
                  </React.Fragment>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-green-600 text-white hover:bg-green-700">
                Submit review
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="flex w-full min-w-[450px] flex-col gap-0 p-0"
            >
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={
                  handleReviewSubmit
                }
              >
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle className="text-base font-bold">
                    Finish your review
                  </SheetTitle>

                  <SheetDescription className="text-xs text-muted-foreground">
                    Add a final comment and choose an action for this review.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col text-muted-foreground">
                      <span className="text-sm font-medium text-foreground">
                        Review comment
                      </span>

                      <span className="flex items-center gap-1 text-xs">
                        <span>
                          Markdown is supported for formatting your review comment.
                        </span>
                      </span>
                    </div>

                    <div className="w-full overflow-hidden rounded-lg border">
                      <Tabs
                        value={reviewTab}
                        onValueChange={(
                          value,
                        ) =>
                          setReviewTab(
                            value as
                            | "write"
                            | "preview",
                          )
                        }
                      >
                        <div className="flex items-center justify-between gap-2 border-b bg-muted/10 pr-1.5">
                          <TabsList className="m-1 h-7 bg-transparent">
                            <TabsTrigger
                              value="write"
                              className="px-2.5 text-sm"
                            >
                              Write
                            </TabsTrigger>

                            <TabsTrigger
                              value="preview"
                              className="px-2.5 text-sm"
                            >
                              Preview
                            </TabsTrigger>
                          </TabsList>

                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                            disabled={reviewUploading}
                            onClick={() => reviewFileInputRef.current?.click()}
                          >
                            <ImagePlus className="size-4" />

                            <span>
                              {reviewUploading ? "Uploading..." : "Attach image"}
                            </span>
                          </Button>
                        </div>

                        <TabsContent
                          value="write"
                          className="m-0 p-0"
                        >
                          <input
                            ref={reviewFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleReviewFileUpload}
                          />
                          <Textarea
                            ref={reviewTextareaRef}
                            rows={10}
                            className="h-[345px] resize-none rounded-none border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
                            placeholder="Leave a comment..."
                            value={
                              reviewComment
                            }
                            onChange={(
                              event,
                            ) =>
                              setReviewComment(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </TabsContent>

                        <TabsContent
                          value="preview"
                          className="m-0 overflow-hidden"
                        >
                          <div className="h-[345px] overflow-auto px-4 py-3">
                            {reviewComment.trim() ? (
                              <Markdown
                                content={
                                  reviewComment
                                }
                              />
                            ) : (
                              <p className="text-sm italic text-muted-foreground">
                                Nothing to
                                preview.
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>

                  <Questionnaire
                    items={
                      reviewQuestionnaireItems
                    }
                    defaultItem="review-action"
                    className="w-full"
                    onSubmit={() => { }}
                  >
                    <QuestionnaireItem
                      name="review-action"
                      required
                    >
                      <QuestionnaireChoices>
                        <QuestionnaireChoice
                          value="comment"
                          onChange={() => setReviewAction("comment")}
                        >
                          <span className="font-medium">
                            Comment
                          </span>

                          <span className="text-[12px] text-muted-foreground">
                            Submit general feedback without explicit approval.
                          </span>
                        </QuestionnaireChoice>

                        <QuestionnaireChoice
                          value="approve"
                          disabled={
                            isAuthor
                          }
                          onChange={() => setReviewAction("approved")}
                        >
                          <span className="font-medium">
                            Approve
                          </span>

                          <span className="text-[12px] text-muted-foreground">
                            Approve and merge these changes.
                          </span>
                        </QuestionnaireChoice>

                        <QuestionnaireChoice
                          value="request_changes"
                          disabled={
                            isAuthor
                          }
                          onChange={() => setReviewAction("changes_requested")}
                        >
                          <span className="font-medium">
                            Request changes
                          </span>

                          <span className="text-[12px] text-muted-foreground">
                            Submit feedback suggesting changes.
                          </span>
                        </QuestionnaireChoice>
                      </QuestionnaireChoices>

                      <QuestionnaireError />
                    </QuestionnaireItem>
                  </Questionnaire>
                </div>

                <div className="border-t p-4">
                  <div className="flex items-center justify-end gap-2">
                    <SheetClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </SheetClose>

                    <Button
                      type="submit"
                      disabled={submitReview.isPending}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {submitReview.isPending ? "Submitting..." : "Submit review"}
                    </Button>
                  </div>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main */}

      <div className="flex min-w-0">
        {/* File tree */}

        {showFileTree && (
          <>
            <div className="sticky top-0 ml-4 flex h-[calc(100vh-4rem)] w-[280px] shrink-0 flex-col pr-3">
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search files..."
                  className="pl-8"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <TreeView
                  data={buildFileTree(
                    filteredFiles,
                    viewedFiles,
                    handleViewedChange,
                    scrollToDiff,
                  )}
                />
              </div>
            </div>

            <div className="self-stretch">
              <div className="h-full w-px bg-border" />
            </div>
          </>
        )}

        {/* Diffs */}

        <div className="min-w-0 flex-1 pl-3">
          {selectedCommitHash &&
            selectedCommit && (
              <div className="mt-3 overflow-hidden rounded-lg border bg-muted/30">
                <div className="px-3 py-2">
                  <p className="truncate text-base font-semibold text-foreground hover:underline">
                    {
                      selectedCommit.message.split(
                        "\n",
                      )[0]
                    }
                  </p>
                  {selectedCommit.body && (
                    <p className="mt-1 w-full text-[13px] text-muted-foreground">
                      {selectedCommit.body}
                    </p>
                  )}
                </div>

                <div className="border-t px-3 py-2 bg-muted/50">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="text-[8px] font-medium">
                        {selectedCommit.authorName?.[0]?.toUpperCase() ??
                          "?"}
                      </AvatarFallback>
                    </Avatar>

                    <span className="text-sm font-medium">
                      {
                        selectedCommit.authorName
                      }
                    </span>

                    <span className="text-xs text-muted-foreground">
                      commited{" "}
                      {timeAgo(
                        selectedCommit.date,
                      )}
                    </span>

                    <Badge variant="outline">
                      <Link
                        to={`/${owner}/${repo}/commits/${selectedCommitHash}`}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {selectedCommitHash.slice(
                          0,
                          7,
                        )}
                      </Link>
                    </Badge>

                    <div className="ml-auto flex shrink-0 items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger
                          asChild
                        >
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={
                              commits.length <=
                              1 ||
                              commits.findIndex(
                                (c) =>
                                  c.hash ===
                                  selectedCommitHash,
                              ) <= 0
                            }
                            onClick={() => {
                              const idx =
                                commits.findIndex(
                                  (c) =>
                                    c.hash ===
                                    selectedCommitHash,
                                )

                              if (idx > 0) {
                                setSelectedCommitHash(
                                  commits[
                                    idx -
                                    1
                                  ].hash,
                                )
                              }
                            }}
                          >
                            <ChevronLeft className="size-3.5" />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent>
                          Previous commit
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger
                          asChild
                        >
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={
                              commits.length <=
                              1 ||
                              commits.findIndex(
                                (c) =>
                                  c.hash ===
                                  selectedCommitHash,
                              ) >=
                              commits.length -
                              1
                            }
                            onClick={() => {
                              const idx =
                                commits.findIndex(
                                  (c) =>
                                    c.hash ===
                                    selectedCommitHash,
                                )

                              if (
                                idx <
                                commits.length -
                                1
                              ) {
                                setSelectedCommitHash(
                                  commits[
                                    idx +
                                    1
                                  ].hash,
                                )
                              }
                            }}
                          >
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent>
                          Next commit
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {fileDiffs.map((diff) => (
            <CodeCommitBlock
              key={diff.path}
              diff={diff}
              expanded={allExpanded}
              expandGeneration={
                expandGeneration
              }
              diffId={filePathToId(
                diff.path,
              )}
              viewed={viewedFiles.has(
                diff.path,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Changedfiles
