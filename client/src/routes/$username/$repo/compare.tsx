import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  AlertTriangleIcon,
  ArrowLeftRight,
  FileDiff,
  GitBranch,
  GitCommit,
  SquarePlus,
  SquarePen,
  SquareMinus,
  Users,
} from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import Commits from "@/components/repo/pulls/content/commits"

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

function NoDifferences() {
  return (
    <Alert className="my-4 w-full border-yellow-300 bg-yellow-50 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-100">
      <AlertTriangleIcon className="text-yellow-600 dark:text-yellow-500" />

      <AlertTitle>There are no differences</AlertTitle>

      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        The base and compare branches are identical. Select different branches
        to see the changes between them.
      </AlertDescription>
    </Alert>
  )
}

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
        <ComboboxEmpty>
          No branches found.
        </ComboboxEmpty>

        <ComboboxList>
          {(branch) => (
            <ComboboxItem
              key={branch}
              value={branch}
              className="gap-3"
            >
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

function ChangedFilesItem({
  name,
  status,
  additions,
  deletions,
}: ChangedFile) {
  const statusConfig = {
    added: {
      icon: SquarePlus,
      iconClass: "text-green-600 dark:text-green-500",
      squares: [
        "bg-green-500",
        "bg-green-500",
        "bg-green-500",
        "bg-green-500",
        "bg-green-500",
      ],
    },
    changed: {
      icon: SquarePen,
      iconClass: "text-yellow-600 dark:text-yellow-500",
      squares: [
        "bg-green-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-yellow-500",
        "bg-red-500",
      ],
    },
    removed: {
      icon: SquareMinus,
      iconClass: "text-red-600 dark:text-red-500",
      squares: [
        "bg-red-500",
        "bg-red-500",
        "bg-red-500",
        "bg-red-500",
        "bg-red-500",
      ],
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center justify-between border-b px-3 py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${config.iconClass}`} />

        <span className="text-sm font-semibold">
          {name}
        </span>
      </div>

      <div className="flex items-center gap-2">


        <span className="text-xs">
          {additions > 0 && (
            <span className="font-medium text-green-600 dark:text-green-500">
              +{additions}
            </span>
          )}

          {additions > 0 && deletions > 0 && " "}

          {deletions > 0 && (
            <span className="font-medium text-red-600 dark:text-red-500">
              -{deletions}
            </span>
          )}
        </span>

        <div className="flex items-center gap-0.5">
          {config.squares.map((square, index) => (
            <span
              key={index}
              className={`size-2 ${square}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CompareComponent() {
  const [showWarning] = useState(false)
  const [showFiles, setShowFiles] = useState(false)

  const stats = {
    commits: 3,
    filesChanged: 2,
    contributors: 1,
  }

  return (
    <div>
      <div className="mx-40 flex flex-col">
        <span className="text-2xl font-medium">
          Compare changes
        </span>

        <span className="text-sm text-muted-foreground">
          Choose two branches to see what’s changed or to start a new
          pull request.
        </span>

        {showWarning && <NoDifferences />}

        <div className="mt-2 flex w-full items-center rounded-md border border-dashed bg-accent/20 p-2">
          <svg
            className="mr-3 size-4 shrink-0 text-muted-foreground"
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
              <path d="M18 21a2 2 0 1 0 0-4a2 2 0 0 0 0 4M6 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4m12 10V7s0-2-2-2h-3M6 7v10s0 2 2 2h3" />
              <path d="M15 7.5L12.5 5L15 2.5m-6.5 14L11 19l-2.5 2.5" />
            </g>
          </svg>

          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <BranchCombobox
                placeholder="Choose base branch"
              />
            </div>

            <ArrowLeftRight className="size-4 shrink-0 text-muted-foreground" />

            <div className="flex flex-col">
              <BranchCombobox
                placeholder="Choose compare branch"
              />
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
              2 changed files
            </button>{" "}
            with{" "}
            <span className="font-semibold">
              63 additions
            </span>{" "}
            and{" "}
            <span className="font-semibold">
              42 deletions
            </span>
          </span>
        </div>

        {showFiles && (
          <div className="mt-3 overflow-hidden rounded-md border">
            {changedFiles.map((file) => (
              <ChangedFilesItem
                key={file.name}
                {...file}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
