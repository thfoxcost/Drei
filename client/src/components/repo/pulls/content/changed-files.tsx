"use client"

import * as React from "react"
import { toast } from "sonner"

import { Separator } from "#/components/ui/separator"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
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
| Commits
|--------------------------------------------------------------------------
*/

const commits = [
    {
        author: "thefoxcost",
        avatar: "https://github.com/shadcn.png",
        fallback: "CN",
        message:
            "Fix commit page layout and improve changed files UI",
        hash: "c33e686",
    },
    {
        author: "vercel",
        avatar: "https://github.com/vercel.png",
        fallback: "VC",
        message:
            "Update repository navigation and sidebar behavior",
        hash: "a82f19d",
    },
    {
        author: "torvalds",
        avatar: "https://github.com/torvalds.png",
        fallback: "LT",
        message:
            "Refactor commit diff rendering",
        hash: "7be42c1",
    },
    {
        author: "gaearon",
        avatar: "https://github.com/gaearon.png",
        fallback: "GA",
        message:
            "Improve component rendering performance",
        hash: "f19d3a8",
    },
    {
        author: "yyx990803",
        avatar: "https://github.com/yyx990803.png",
        fallback: "YY",
        message:
            "Update dependencies and clean up unused imports",
        hash: "42dc7e5",
    },
    {
        author: "sindresorhus",
        avatar: "https://github.com/sindresorhus.png",
        fallback: "SO",
        message:
            "Add missing tests for commit components",
        hash: "91ac4f2",
    },
]

/*
|--------------------------------------------------------------------------
| Dummy diff data
|--------------------------------------------------------------------------
*/

const fileDiffs: FileDiff[] = [
    {
        path: "client/src/components/repo/commits/code-commit.tsx",
        action: "modified",
        additions: 21,
        deletions: 8,
        hunks: [
            {
                header:
                    "@@ -42,12 +42,25 @@ function CodeCommitBlock",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 42,
                        newLine: 42,
                        content:
                            "const [isExpanded, setIsExpanded] = useState(true)",
                    },
                    {
                        type: "unchanged",
                        oldLine: 43,
                        newLine: 43,
                        content:
                            "const [syncedGeneration, setSyncedGeneration] = useState(0)",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 44,
                        content: "",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 45,
                        content: "useEffect(() => {",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 46,
                        content:
                            "    if (expandGeneration !== syncedGeneration) {",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 47,
                        content:
                            "        setIsExpanded(expanded)",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 48,
                        content:
                            "        setSyncedGeneration(expandGeneration)",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 49,
                        content: "    }",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 50,
                        content:
                            "}, [expandGeneration, expanded, syncedGeneration])",
                    },
                    {
                        type: "unchanged",
                        oldLine: 44,
                        newLine: 51,
                        content: "",
                    },
                    {
                        type: "removed",
                        oldLine: 45,
                        newLine: null,
                        content: "const file = diff.path",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 52,
                        content: "const filePath = diff.path",
                    },
                    {
                        type: "unchanged",
                        oldLine: 46,
                        newLine: 53,
                        content: "",
                    },
                    {
                        type: "unchanged",
                        oldLine: 47,
                        newLine: 54,
                        content:
                            "const additions = diff.additions",
                    },
                    {
                        type: "unchanged",
                        oldLine: 48,
                        newLine: 55,
                        content:
                            "const deletions = diff.deletions",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/routes/$username/$repo/commits.$hash.tsx",
        action: "modified",
        additions: 34,
        deletions: 12,
        hunks: [
            {
                header: "@@ -18,15 +18,37 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 18,
                        newLine: 18,
                        content:
                            "import { useNavigate } from '@tanstack/react-router'",
                    },
                    {
                        type: "unchanged",
                        oldLine: 19,
                        newLine: 19,
                        content:
                            "import { useCommit } from '#/hooks/use-commit'",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 20,
                        content:
                            "import CodeCommitBlock from '#/components/repo/commits/code-commit'",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 21,
                        content:
                            "import type { FileDiff } from '#/components/repo/commits/code-commit'",
                    },
                    {
                        type: "unchanged",
                        oldLine: 20,
                        newLine: 22,
                        content: "",
                    },
                    {
                        type: "unchanged",
                        oldLine: 21,
                        newLine: 23,
                        content:
                            "export default function CommitPage() {",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 24,
                        content:
                            "const [search, setSearch] = useState('')",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 25,
                        content:
                            "const [expandGeneration, setExpandGeneration] = useState(0)",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 26,
                        content: "",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 27,
                        content:
                            "const expandAll = () => setExpanded(true)",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 28,
                        content:
                            "const collapseAll = () => setExpanded(false)",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/components/repo/commits/commit.tsx",
        action: "modified",
        additions: 18,
        deletions: 5,
        hunks: [
            {
                header: "@@ -71,10 +71,23 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 71,
                        newLine: 71,
                        content: "return (",
                    },
                    {
                        type: "unchanged",
                        oldLine: 72,
                        newLine: 72,
                        content:
                            "<div className=\"flex flex-col\">",
                    },
                    {
                        type: "removed",
                        oldLine: 73,
                        newLine: null,
                        content: "<CommitHeader />",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 73,
                        content:
                            "<CommitHeader commit={commit} />",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 74,
                        content:
                            "<Changedfiles />",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 75,
                        content: "",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 76,
                        content:
                            "{diffs.map((diff) => (",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 77,
                        content:
                            "<CodeCommitBlock",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 78,
                        content:
                            "diff={diff}",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 79,
                        content:
                            "/>",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 80,
                        content:
                            "))}",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/components/ui/dropdown-menu.tsx",
        action: "modified",
        additions: 7,
        deletions: 3,
        hunks: [
            {
                header: "@@ -34,9 +34,13 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 34,
                        newLine: 34,
                        content:
                            "export function DropdownMenuItem({",
                    },
                    {
                        type: "unchanged",
                        oldLine: 35,
                        newLine: 35,
                        content: "    className,",
                    },
                    {
                        type: "removed",
                        oldLine: 36,
                        newLine: null,
                        content: "    children,",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 36,
                        content: "    children,",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 37,
                        content: "    icon,",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 38,
                        content: "    ...props",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/hooks/use-commit.ts",
        action: "added",
        additions: 42,
        deletions: 0,
        hunks: [
            {
                header: "@@ -0,0 +1,12 @@",
                lines: [
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 1,
                        content:
                            "import { useQuery } from '@tanstack/react-query'",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 2,
                        content:
                            "import type { CommitDetail } from '#/types/commit'",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 3,
                        content: "",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 4,
                        content:
                            "export function useCommit(hash: string) {",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 5,
                        content:
                            "    return useQuery({",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 6,
                        content:
                            "        queryKey: ['commit', hash],",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 7,
                        content:
                            "        queryFn: async () => {",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 8,
                        content:
                            "            const response = await fetch('/api/commits/' + hash)",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 9,
                        content:
                            "            return response.json()",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 10,
                        content:
                            "        },",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 11,
                        content:
                            "    })",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 12,
                        content:
                            "}",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/components/repo/commits/commit-header.tsx",
        action: "modified",
        additions: 9,
        deletions: 4,
        hunks: [
            {
                header: "@@ -12,8 +12,13 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 12,
                        newLine: 12,
                        content:
                            "export function CommitHeader({ commit }: Props) {",
                    },
                    {
                        type: "unchanged",
                        oldLine: 13,
                        newLine: 13,
                        content: "return (",
                    },
                    {
                        type: "removed",
                        oldLine: 14,
                        newLine: null,
                        content:
                            "<h1>{commit.message}</h1>",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 14,
                        content:
                            "<div className=\"flex flex-col gap-1\">",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 15,
                        content:
                            "<h1 className=\"text-lg font-semibold\">",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 16,
                        content:
                            "{commit.message}",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 17,
                        content:
                            "</h1>",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/components/repo/file-tree.tsx",
        action: "modified",
        additions: 12,
        deletions: 6,
        hunks: [
            {
                header: "@@ -108,14 +108,20 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 108,
                        newLine: 108,
                        content:
                            "return files.map((file) => {",
                    },
                    {
                        type: "removed",
                        oldLine: 109,
                        newLine: null,
                        content:
                            "return <FileItem file={file} />",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 109,
                        content: "return (",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 110,
                        content:
                            "<FileItem",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 111,
                        content:
                            "file={file}",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 112,
                        content:
                            "onSelect={handleFileSelect}",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 113,
                        content:
                            "/>",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/lib/utils.ts",
        action: "modified",
        additions: 5,
        deletions: 2,
        hunks: [
            {
                header: "@@ -4,7 +4,10 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 4,
                        newLine: 4,
                        content:
                            "export function cn(...inputs: ClassValue[]) {",
                    },
                    {
                        type: "unchanged",
                        oldLine: 5,
                        newLine: 5,
                        content:
                            "return twMerge(clsx(inputs))",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 6,
                        content: "}",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 7,
                        content: "",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 8,
                        content:
                            "export function isDefined<T>(value: T | null | undefined): value is T {",
                    },
                ],
            },
        ],
    },

    {
        path: "README.md",
        action: "modified",
        additions: 6,
        deletions: 2,
        hunks: [
            {
                header: "@@ -10,5 +10,9 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 10,
                        newLine: 10,
                        content: "## Development",
                    },
                    {
                        type: "unchanged",
                        oldLine: 11,
                        newLine: 11,
                        content:
                            "Install dependencies before starting the app.",
                    },
                    {
                        type: "removed",
                        oldLine: 12,
                        newLine: null,
                        content: "npm install",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 12,
                        content: "pnpm install",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 13,
                        content: "",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 14,
                        content: "pnpm dev",
                    },
                ],
            },
        ],
    },

    {
        path: "client/src/components/repo/issues/markdown-editor.tsx",
        action: "modified",
        additions: 8,
        deletions: 3,
        hunks: [
            {
                header: "@@ -55,8 +55,13 @@",
                lines: [
                    {
                        type: "unchanged",
                        oldLine: 55,
                        newLine: 55,
                        content:
                            "const [tab, setTab] = useState('write')",
                    },
                    {
                        type: "removed",
                        oldLine: 56,
                        newLine: null,
                        content:
                            "return <Textarea value={value} />",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 56,
                        content: "return (",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 57,
                        content:
                            "<div className=\"flex flex-col\">",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 58,
                        content:
                            "<EditorTabs value={tab} onValueChange={setTab} />",
                    },
                    {
                        type: "added",
                        oldLine: null,
                        newLine: 59,
                        content:
                            "<Textarea value={value} />",
                    },
                ],
            },
        ],
    },
]

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
                className="stroke-green-600 transition-all duration-300 dark:stroke-green-500"
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

function Changedfiles() {
    /*
     * Dumb state for now.
     *
     * true  = current user is the PR author
     * false = current user is a reviewer
     *
     * Later this can come from your actual auth / PR data.
     */
    const isAuthor = false

    const [search, setSearch] =
        React.useState("")

    const [
        showFileTree,
        setShowFileTree,
    ] = React.useState(true)

    const [
        viewedFiles,
        setViewedFiles,
    ] = React.useState<Set<string>>(
        new Set(),
    )

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
        reviewTab,
        setReviewTab,
    ] = React.useState<
        "write" | "preview"
    >("write")

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
    }

    /*
     * Scroll to diff
     */

    const scrollToDiff = (path: string) => {
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
        }, [search])

    /*
     * Progress
     */

    const totalFiles = fileDiffs.length

    const viewedCount = viewedFiles.size

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

        const blob = new Blob([content], {
            type: "text/plain",
        })

        const url =
            URL.createObjectURL(blob)

        const anchor =
            document.createElement("a")

        anchor.href = url
        anchor.download = "commit.diff"

        anchor.click()

        URL.revokeObjectURL(url)
    }

    /*
     * Submit review
     */

    const handleReviewSubmit = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        const formData =
            new FormData(
                event.currentTarget,
            )

        const action =
            formData.get("review-action")

        const comment =
            reviewComment.trim()

        if (!action) {
            toast.error(
                "Please choose a review action.",
            )

            return
        }

        toast("Review submitted", {
            description: [
                `Action: ${action}`,
                `Comment: ${comment || "None"
                }`,
            ].join(" · "),
        })
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
                                    value={
                                        progress
                                    }
                                    size={16}
                                    strokeWidth={
                                        2
                                    }
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
                                {viewedCount}{" "}
                                of{" "}
                                {totalFiles}{" "}
                                files viewed
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
                                onClick={() =>
                                    setViewedFiles(
                                        new Set(
                                            fileDiffs.map(
                                                (
                                                    file,
                                                ) =>
                                                    file.path,
                                            ),
                                        ),
                                    )
                                }
                            >
                                Mark all as viewed
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() =>
                                    setViewedFiles(
                                        new Set(),
                                    )
                                }
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
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-[480px]"
                        >
                            <DropdownMenuItem className="flex items-center justify-between">
                                <span className="font-medium">
                                    Show all commits
                                </span>

                                <span className="text-xs text-muted-foreground">
                                    {
                                        commits.length
                                    }{" "}
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
                                        <DropdownMenuItem className="flex items-center gap-2">
                                            <Avatar className="size-6 shrink-0">
                                                <AvatarImage
                                                    src={
                                                        commit.avatar
                                                    }
                                                    alt={
                                                        commit.author
                                                    }
                                                />

                                                <AvatarFallback>
                                                    {
                                                        commit.fallback
                                                    }
                                                </AvatarFallback>
                                            </Avatar>

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
                                                    commit.hash
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
                            className="flex w-full flex-col gap-0 p-0 min-w-[450px]"
                        >
                            <form
                                className="flex min-h-0 flex-1 flex-col"
                                onSubmit={
                                    handleReviewSubmit
                                }
                            >
                                {/* Header */}

                                <SheetHeader className="border-b px-4 py-3">
                                    <SheetTitle className="text-base font-bold">
                                        Finish your review
                                    </SheetTitle>

                                    <SheetDescription className="text-xs text-muted-foreground">
                                        Add a final comment and choose an action for this review.
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Body */}

                                <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
                                    {/* Comment */}

                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col text-muted-foreground">
                                            <span className="text-sm font-medium text-foreground">
                                                Review comment
                                            </span>

                                            <span className="flex items-center gap-1 text-xs">
                                                <span>
                                                    Markdown is supported for formatting your review comment.                                                </span>
                                            </span>
                                        </div>
                                        <div className="w-full overflow-hidden rounded-lg border">
                                            <Tabs
                                                value={
                                                    reviewTab
                                                }
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
                                                    >
                                                        <ImagePlus className="size-4" />

                                                        <span>
                                                            Attach
                                                            image
                                                        </span>
                                                    </Button>
                                                </div>

                                                <TabsContent
                                                    value="write"
                                                    className="m-0 p-0"
                                                >
                                                    <Textarea
                                                        rows={
                                                            10
                                                        }
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
                                                                Nothing
                                                                to
                                                                preview.
                                                            </p>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    </div>

                                    {/* Review action */}

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
                                                <QuestionnaireChoice value="comment">
                                                    <span className="font-medium">
                                                        Comment
                                                    </span>

                                                    <span className="text-[12px] text-muted-foreground">
                                                        Submit general feedback without explicit approval.
                                                    </span>
                                                </QuestionnaireChoice>

                                                {/* Approve */}

                                                <QuestionnaireChoice
                                                    value="approve"
                                                    disabled={
                                                        isAuthor
                                                    }
                                                >
                                                    <span className="font-medium">
                                                        Approve
                                                    </span>

                                                    <span className="text-[12px] text-muted-foreground">
                                                        Approve and merge these changes.
                                                    </span>
                                                </QuestionnaireChoice>

                                                {/* Request changes */}

                                                <QuestionnaireChoice
                                                    value="request_changes"
                                                    disabled={
                                                        isAuthor
                                                    }
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

                                {/* Footer */}

                                <div className="border-t p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <SheetClose
                                            asChild
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </SheetClose>

                                        <Button
                                            type="submit"
                                            className="bg-green-600 text-white hover:bg-green-700"
                                        >
                                            Submit review
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
                            {/* Search */}

                            <div className="relative mt-3">
                                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(
                                        event,
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Search files..."
                                    className="pl-8"
                                />
                            </div>

                            {/* Tree */}

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
                    {fileDiffs.map(
                        (diff) => (
                            <CodeCommitBlock
                                key={diff.path}
                                diff={diff}
                                expanded={
                                    allExpanded
                                }
                                expandGeneration={
                                    expandGeneration
                                }
                                diffId={filePathToId(
                                    diff.path,
                                )}
                            />
                        ),
                    )}
                </div>
            </div>
        </div>
    )
}

export default Changedfiles