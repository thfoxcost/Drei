import { useState } from "react"
import { Badge } from "#/components/reui/badge"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "#/components/ui/avatar"
import {
    Diff,
    Ellipsis,
    File,
    FileCode,
    Folder,
    GitBranch,
    PanelLeft,
    Search,
    SquareDot,
    SquareMinus,
    SquarePlus,
} from "lucide-react"
import { useNavigate, useLocation } from "@tanstack/react-router"
import { Separator } from "#/components/ui/separator"
import {
    type TreeDataItem,
    TreeView,
} from "#/components/tree-view"
import CodeCommitBlock from "./code-commit"

type ChangeStatus = "added" | "changed" | "removed"

type CommitFile = {
    path: string
    status: ChangeStatus
}

const mockChangedFiles: CommitFile[] = [
    {
        path: "main.go",
        status: "changed",
    },
    {
        path: "internal.go",
        status: "added",
    },
    {
        path: "tests/test.nim",
        status: "added",
    },
    {
        path: "tests/test.py",
        status: "changed",
    },
    {
        path: "tests/test.ts",
        status: "removed",
    },
    {
        path: "tests/test.js",
        status: "changed",
    },
]

function getStatusIcon(status: ChangeStatus) {
    if (status === "added") return SquarePlus
    if (status === "changed") return SquareDot
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

function FileRowLabel({
    fileName,
    status,
}: {
    fileName: string
    status: ChangeStatus
}) {
    const StatusIcon = getStatusIcon(status)

    return (
        <div className="flex w-full items-center justify-between gap-2">
            <span className="truncate">{fileName}</span>

            <StatusIcon
                className={`h-4 w-4 shrink-0 ${getStatusColor(status)}`}
            />
        </div>
    )
}

function buildCommitFileTree(
    files: CommitFile[],
): TreeDataItem[] {
    const root: TreeDataItem[] = []

    const sorted = [...files].sort((a, b) =>
        a.path.localeCompare(b.path),
    )

    for (const file of sorted) {
        const parts = file.path.split("/")
        let current = root

        for (let i = 0; i < parts.length - 1; i++) {
            const dirName = parts[i]

            let existing = current.find(
                (n) => n.name === dirName && !!n.children,
            )

            if (!existing) {
                existing = {
                    id: parts.slice(0, i + 1).join("/"),
                    name: dirName,
                    icon: Folder,
                    children: [],
                }

                current.push(existing)
            }

            current = existing.children!
        }

        const fileName = parts[parts.length - 1]

        current.push({
            id: file.path,
            name: (
                <FileRowLabel
                    fileName={fileName}
                    status={file.status}
                />
            ) as unknown as string,
            icon: File,
        })
    }

    return root
}

function Commit() {
    const hash = "691f13d"

    const navigate = useNavigate()
    const location = useLocation()

    const [search, setSearch] = useState("")
    const [codeSearch, setCodeSearch] = useState("")
    const [showFileTree, setShowFileTree] = useState(true)

    const [, owner, repo] = location.pathname.split("/")

    const filteredFiles = mockChangedFiles.filter((file) =>
        file.path.toLowerCase().includes(search.toLowerCase()),
    )

    return (
        <div>
            <div className="mx-4 flex items-center justify-between">
                <span className="text-2xl font-medium">
                    Commit{" "}
                    <Badge size="xl" variant="secondary">
                        {hash}
                    </Badge>
                </span>

                <Button
                    variant="outline"
                    onClick={() =>
                        navigate({
                            to: `/${owner}/${repo}`,
                        })
                    }
                >
                    <FileCode />
                    Browse Files
                </Button>
            </div>

            <div className="mx-4 mt-2 rounded-md border p-3">
                <div className="font-mono text-sm">
                    feat: enhance profile handling with biography
                    fetching and error management
                </div>

                <div className="mt-2 font-mono text-xs text-muted-foreground">
                    It is a long established fact that a reader will be
                    distracted by the readable content of a page when
                    looking at its layout. It has a more-or-less normal
                    distribution of letters, as opposed to using
                    'Content here, content here', making it look like
                    readable English.
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GitBranch
                            size={18}
                            className="text-muted-foreground"
                        />

                        <Badge
                            size="lg"
                            variant="secondary"
                        >
                            main
                        </Badge>
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">
                            1 parent
                        </span>

                        <span className="font-mono underline">
                            8e78f03
                        </span>

                        <span className="text-muted-foreground">
                            commit
                        </span>

                        <span className="font-mono underline">
                            691f13d
                        </span>
                    </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Diff
                            size={18}
                            className="text-muted-foreground"
                        />

                        <span className="text-sm">
                            <span className="font-semibold text-orange-500">
                                11 changed files
                            </span>{" "}
                            with{" "}
                            <span className="font-semibold text-green-600 dark:text-green-500">
                                1155 additions
                            </span>{" "}
                            and{" "}
                            <span className="font-semibold text-red-600 dark:text-red-500">
                                187 deletions
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Avatar size="sm">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>
                                CN
                            </AvatarFallback>
                        </Avatar>

                        <span className="text-sm">
                            thefoxcost{" "}
                            <span className="text-muted-foreground">
                                committed 2 days ago
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <Separator className="mt-4" />

            <div className="flex min-h-[400px]">
                {showFileTree && (
                    <>
                        <div className="ml-4 w-[250px] shrink-0 pr-2">
                            <div className="relative mt-4">
                                <Search
                                    className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                />

                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search files..."
                                    className="pl-8"
                                />
                            </div>

                            <TreeView
                                data={buildCommitFileTree(
                                    filteredFiles,
                                )}
                            />
                        </div>

                        <Separator orientation="vertical" />
                    </>
                )}

                <div className="m-3 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    setShowFileTree(
                                        (value) => !value,
                                    )
                                }
                            >
                                <PanelLeft />
                            </Button>

                            <Input
                                type="search"
                                placeholder="Search within code"
                                value={codeSearch}
                                onChange={(e) =>
                                    setCodeSearch(e.target.value)
                                }
                                className="w-[300px]"
                            />
                        </div>

                        <Button variant="outline">
                            <Ellipsis />
                        </Button>
                    </div>

                    <CodeCommitBlock search={codeSearch} />
                </div>
            </div>
        </div>
    )
}

export default Commit