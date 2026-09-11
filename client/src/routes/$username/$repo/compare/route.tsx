import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useState } from "react"
import {
  ArrowLeftRight,
  FileDiff,
  GitBranch,
  GitCommit,
  SquareDot,
  SquareMinus,
  SquarePlus,
  Users,
} from "lucide-react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import Commits from "@/components/repo/pulls/content/commits"
import CodeCommitBlock, {
  type FileDiff as CodeFileDiff,
} from "@/components/repo/commits/code-commit"

export const Route = createFileRoute("/$username/$repo/compare")({
  component: CompareComponent,
})

const branches = [
  "main",
  "develop",
  "feature/pulls",
  "fix/performance",
  "feat/compare",
]

type ChangedFileStatus = "added" | "changed" | "removed"

type ChangedFile = {
  name: string
  status: ChangedFileStatus
  additions: number
  deletions: number
}

const changedFiles: ChangedFile[] = [
  {
    name: "pr-detail.tsx",
    status: "changed",
    additions: 122,
    deletions: 3,
  },
  {
    name: "pull-request.tsx",
    status: "added",
    additions: 86,
    deletions: 0,
  },
  {
    name: "old-review.tsx",
    status: "removed",
    additions: 0,
    deletions: 42,
  },
]

const fileDiffs: CodeFileDiff[] = [
  {
    path: "pr-detail.tsx",
    action: "changed",
    additions: 122,
    deletions: 3,
    hunks: [
      {
        header: "@@ -42,8 +42,127 @@",
        lines: [
          {
            type: "unchanged",
            oldLine: 42,
            newLine: 42,
            content: 'import { useState } from "react"',
          },
          {
            type: "unchanged",
            oldLine: 43,
            newLine: 43,
            content: 'import { Button } from "@/components/ui/button"',
          },
          {
            type: "removed",
            oldLine: 44,
            newLine: null,
            content: "const isOpen = false",
          },
          {
            type: "removed",
            oldLine: 45,
            newLine: null,
            content: "const showComments = true",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 44,
            content: "const [isOpen, setIsOpen] = useState(false)",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 45,
            content: "const [showComments, setShowComments] = useState(true)",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 46,
            content:
              "const [activeTab, setActiveTab] = useState('conversation')",
          },
          {
            type: "unchanged",
            oldLine: 46,
            newLine: 47,
            content: "return (",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 48,
            content: "  <div className='flex flex-col'>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 49,
            content: "    <PullRequestHeader />",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 50,
            content: "    <PullRequestTabs activeTab={activeTab} />",
          },
          {
            type: "unchanged",
            oldLine: 47,
            newLine: 51,
            content: "  </div>",
          },
        ],
      },
    ],
  },
  {
    path: "pull-request.tsx",
    action: "added",
    additions: 86,
    deletions: 0,
    hunks: [
      {
        header: "@@ -0,0 +1,86 @@",
        lines: [
          {
            type: "added",
            oldLine: null,
            newLine: 1,
            content: 'import { GitPullRequest } from "lucide-react"',
          },
          {
            type: "added",
            oldLine: null,
            newLine: 2,
            content: 'import { Button } from "@/components/ui/button"',
          },
          {
            type: "added",
            oldLine: null,
            newLine: 3,
            content: 'import { Badge } from "@/components/ui/badge"',
          },
          {
            type: "added",
            oldLine: null,
            newLine: 4,
            content: "",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 5,
            content: "export function PullRequest() {",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 6,
            content: "  return (",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 7,
            content: "    <div className='rounded-md border'>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 8,
            content: "      <div className='flex items-center gap-2 p-3'>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 9,
            content: "        <GitPullRequest className='size-4' />",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 10,
            content: "        <span>Pull request</span>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 11,
            content: "        <Badge>Open</Badge>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 12,
            content: "      </div>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 13,
            content: "    </div>",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 14,
            content: "  )",
          },
          {
            type: "added",
            oldLine: null,
            newLine: 15,
            content: "}",
          },
        ],
      },
    ],
  },
  {
    path: "old-review.tsx",
    action: "removed",
    additions: 0,
    deletions: 42,
    hunks: [
      {
        header: "@@ -1,42 +0,0 @@",
        lines: [
          {
            type: "removed",
            oldLine: 1,
            newLine: null,
            content: 'import { ReviewComment } from "./review-comment"',
          },
          {
            type: "removed",
            oldLine: 2,
            newLine: null,
            content: 'import { Avatar } from "@/components/ui/avatar"',
          },
          {
            type: "removed",
            oldLine: 3,
            newLine: null,
            content: "",
          },
          {
            type: "removed",
            oldLine: 4,
            newLine: null,
            content: "export function OldReview() {",
          },
          {
            type: "removed",
            oldLine: 5,
            newLine: null,
            content: "  return (",
          },
          {
            type: "removed",
            oldLine: 6,
            newLine: null,
            content: "    <ReviewComment />",
          },
          {
            type: "removed",
            oldLine: 7,
            newLine: null,
            content: "  )",
          },
          {
            type: "removed",
            oldLine: 8,
            newLine: null,
            content: "}",
          },
        ],
      },
    ],
  },
]

function BranchCombobox({
  placeholder,
  disabled,
}: {
  placeholder: string
  disabled?: boolean
}) {
  return (
    <Combobox items={branches}>
      <ComboboxInput
        placeholder={placeholder}
        className="w-81"
        disabled={disabled}
      />

      <ComboboxContent>
        <ComboboxEmpty>No branches found.</ComboboxEmpty>

        <ComboboxList>
          {(branch) => (
            <ComboboxItem key={branch} value={branch} className="gap-3">
              <GitBranch className="size-4 shrink-0 text-muted-foreground" />

              <span className="truncate">
                <span className="text-muted-foreground">
                  thefoxcost/helloworld:
                </span>
                {branch}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function ChangedFilesItem({ file }: { file: ChangedFile }) {
  const maxSquares = 5
  const total = file.additions + file.deletions

  const additionSquares =
    total === 0 ? 0 : Math.round((file.additions / total) * maxSquares)

  const deletionSquares =
    total === 0 ? 0 : maxSquares - additionSquares

  return (
    <div className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0">
      {file.status === "added" && (
        <SquarePlus className="size-4 shrink-0 text-green-600 dark:text-green-500" />
      )}

      {file.status === "changed" && (
        <SquareDot className="size-4 shrink-0 text-muted-foreground" />
      )}

      {file.status === "removed" && (
        <SquareMinus className="size-4 shrink-0 text-red-600 dark:text-red-500" />
      )}

      <span className="min-w-0 flex-1 truncate">{file.name}</span>

      <span className="flex shrink-0 items-center gap-0.5">
        {Array.from({ length: additionSquares }).map((_, index) => (
          <span
            key={`add-${index}`}
            className="size-1 rounded-[1px] bg-green-500"
          />
        ))}

        {Array.from({ length: deletionSquares }).map((_, index) => (
          <span
            key={`remove-${index}`}
            className="size-1 rounded-[1px] bg-red-500"
          />
        ))}
      </span>

      <span className="flex shrink-0 items-center gap-2 text-xs">
        {file.additions > 0 && (
          <span className="text-green-600 dark:text-green-500">
            +{file.additions}
          </span>
        )}

        {file.deletions > 0 && (
          <span className="text-red-600 dark:text-red-500">
            -{file.deletions}
          </span>
        )}
      </span>
    </div>
  )
}

export function CompareComponent() {
  const [showFiles, setShowFiles] = useState(false)

  const pathname = useRouterState().location.pathname

  const comparison = pathname.split("/compare/")[1]

  const hasComparison =
    !!comparison && comparison.includes("...")

  const title = hasComparison
    ? "Open a pull request"
    : "Compare changes"

  const description = hasComparison
    ? "Review the changes between these two branches and open a pull request."
    : "Choose two branches to see what’s changed or to start a new pull request."

  const stats = {
    commits: 3,
    filesChanged: changedFiles.length,
    contributors: 1,
  }

  return (
    <div>
      <div className="mx-20 flex flex-col">
        <span className="text-2xl font-medium">
          {title}
        </span>

        <span className="text-sm text-muted-foreground">
          {description}
        </span>

        <div className="mt-2 flex w-full items-center rounded-md border border-dashed bg-accent/20 p-2">
          <svg className="ml-1 mr-2 size-4 shrink-0 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="currentColor" d="M9.146 5.854a.5.5 0 1 0 .708-.708L8.707 4H10.5A1.5 1.5 0 0 1 12 5.5v4.55a2.5 2.5 0 1 0 1 0V5.5A2.5 2.5 0 0 0 10.5 3H8.707l1.147-1.146a.5.5 0 0 0-.708-.708l-2 2a.5.5 0 0 0 0 .708zM14 12.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m-8-9a2.5 2.5 0 0 1-2 2.45v4.55A1.5 1.5 0 0 0 5.5 12h1.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L7.293 13H5.5A2.5 2.5 0 0 1 3 10.5V5.95A2.5 2.5 0 1 1 6 3.5m-1 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0" /></svg>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <BranchCombobox placeholder="Choose base branch" />
            </div>

            <ArrowLeftRight className="size-4 shrink-0 text-muted-foreground" />

            <div className="flex flex-col">
              <BranchCombobox placeholder="Choose compare branch" />
            </div>
          </div>
        </div>

        <span className="mt-1 flex items-start">
          <svg
            className="mt-1 size-5 shrink-0 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            >
              <circle cx="8" cy="8" r="6.25" />
              <path d="m8 5.25v0m0 6v-3.5" />
            </g>
          </svg>

          <span className="text-xs leading-5 text-muted-foreground">
            Changes from the compare branch will be merged into the base
            branch. The base branch is the target, while the compare branch
            contains the changes you want to review and merge.
          </span>
        </span>

        <div className="my-2 flex items-center justify-around gap-3 rounded-md border bg-accent/20 py-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <GitCommit className="size-4" />

            <span className="font-semibold text-foreground">
              {stats.commits}
            </span>

            <span>commits</span>
          </span>

          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileDiff className="size-4.5" />

            <span className="font-semibold text-foreground">
              {stats.filesChanged}
            </span>

            <span>files changed</span>
          </span>

          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4" />

            <span className="font-semibold text-foreground">
              {stats.contributors}
            </span>

            <span>contributors</span>
          </span>
        </div>

        <Outlet />

        <div className="mt-2">
          <Commits />
        </div>
      </div>

      <div className="mx-5 mt-5 text-sm">
        <div className="flex items-center gap-2">
          <FileDiff className="size-4 text-muted-foreground" />

          <span>
            Showing{" "}
            <button
              type="button"
              onClick={() => setShowFiles((value) => !value)}
              className="font-semibold hover:underline"
            >
              {changedFiles.length} changed files
            </button>{" "}
            with{" "}
            <span className="font-semibold text-green-600 dark:text-green-500">
              +208 additions
            </span>{" "}
            and{" "}
            <span className="font-semibold text-red-600 dark:text-red-500">
              -45 deletions
            </span>
          </span>
        </div>

        {showFiles && (
          <div className="mt-3 rounded-md border">
            {changedFiles.map((file) => (
              <ChangedFilesItem key={file.name} file={file} />
            ))}
          </div>
        )}

        <div className="mb-5 mt-2">
          {fileDiffs.map((diff) => (
            <CodeCommitBlock key={diff.path} diff={diff} />
          ))}
        </div>
      </div>
    </div>
  )
}