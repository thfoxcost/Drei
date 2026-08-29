import { useState } from "react"
import { Check, ChevronDown, Copy } from "lucide-react"
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard"

type DiffLine = {
    type: "added" | "removed" | "unchanged"
    oldLine?: number
    newLine?: number
    content: string
}

const diffLines: DiffLine[] = [
    {
        type: "unchanged",
        oldLine: 67,
        newLine: 67,
        content: "function ContentAppearance() {",
    },
    {
        type: "unchanged",
        oldLine: 68,
        newLine: 68,
        content: '    const [theme, setTheme] = useState("dark")',
    },
    {
        type: "removed",
        oldLine: 69,
        content: '    const oldTheme = "system"',
    },
    {
        type: "added",
        newLine: 69,
        content: '    const newTheme = "dark"',
    },
    {
        type: "added",
        newLine: 70,
        content: "    setTheme(newTheme)",
    },
    {
        type: "unchanged",
        oldLine: 71,
        newLine: 71,
        content: "    return (",
    },
    {
        type: "unchanged",
        oldLine: 72,
        newLine: 72,
        content: "        <div>",
    },
]

function highlightText(content: string, search: string) {
    if (!search.trim()) {
        return content
    }

    const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
    )

    const regex = new RegExp(`(${escapedSearch})`, "gi")

    return content.split(regex).map((part, index) => {
        const isMatch =
            part.toLowerCase() === search.toLowerCase()

        return isMatch ? (
            <mark
                key={index}
                className="rounded-sm bg-yellow-300/60 px-0.5 text-inherit dark:bg-yellow-500/40"
            >
                {part}
            </mark>
        ) : (
            part
        )
    })
}

type CodeCommitBlockProps = {
    search?: string
}

function CodeCommitBlock({
    search = "",
}: CodeCommitBlockProps) {
    const { isCopied, copyToClipboard } =
        useCopyToClipboard()

    const [isExpanded, setIsExpanded] = useState(true)

    const filePath =
        "backend/internal/handlers/profile.go"

    return (
        <div className="mt-3 w-full overflow-hidden rounded-md border">
            <div className="flex h-10 items-center gap-2 border-b bg-muted/30 px-2">
                <button
                    type="button"
                    onClick={() =>
                        setIsExpanded((value) => !value)
                    }
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={
                        isExpanded
                            ? "Collapse code"
                            : "Expand code"
                    }
                >
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                            isExpanded
                                ? "rotate-0"
                                : "-rotate-90"
                        }`}
                    />
                </button>

                <span className="cursor-pointer truncate font-mono text-xs transition-colors hover:text-blue-500 hover:underline">
                    {filePath}
                </span>

                <button
                    type="button"
                    onClick={() =>
                        copyToClipboard(filePath)
                    }
                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={
                        isCopied
                            ? "Copied"
                            : "Copy file path"
                    }
                >
                    {isCopied ? (
                        <Check size={15} />
                    ) : (
                        <Copy size={15} />
                    )}
                </button>
            </div>

            {isExpanded && (
                <div className="overflow-x-auto">
                    <div className="min-w-max font-mono text-xs">
                        <div className="flex min-h-7 items-center bg-muted/30 px-2 text-muted-foreground">
                            <span className="whitespace-pre">
                                @@ -67,10 +67,6 @@ function ContentAppearance() {"{"}
                            </span>
                        </div>

                        {diffLines.map((line, index) => {
                            const isAdded =
                                line.type === "added"

                            const isRemoved =
                                line.type === "removed"

                            const isChanged =
                                isAdded || isRemoved

                            return (
                                <div
                                    key={index}
                                    className={`flex min-h-6 ${
                                        isAdded
                                            ? "bg-green-500/10"
                                            : isRemoved
                                              ? "bg-red-500/10"
                                              : ""
                                    }`}
                                >
                                    <span
                                        className={`min-w-8 shrink-0 select-none px-1 text-center ${
                                            isChanged
                                                ? isAdded
                                                    ? "bg-green-500/30 text-green-700 dark:bg-green-500/30 dark:text-green-400"
                                                    : "bg-red-500/30 text-red-700 dark:bg-red-500/30 dark:text-red-400"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {line.oldLine ?? ""}
                                    </span>

                                    <span
                                        className={`min-w-8 shrink-0 select-none px-1 text-center ${
                                            isChanged
                                                ? isAdded
                                                    ? "bg-green-500/30 text-green-700 dark:bg-green-500/30 dark:text-green-400"
                                                    : "bg-red-500/30 text-red-700 dark:bg-red-500/30 dark:text-red-400"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {line.newLine ?? ""}
                                    </span>

                                    <span
                                        className={`w-6 shrink-0 select-none text-center font-semibold ${
                                            isAdded
                                                ? "text-green-600 dark:text-green-500"
                                                : isRemoved
                                                  ? "text-red-600 dark:text-red-500"
                                                  : "text-muted-foreground"
                                        }`}
                                    >
                                        {isAdded
                                            ? "+"
                                            : isRemoved
                                              ? "-"
                                              : ""}
                                    </span>

                                    <code
                                        className={`whitespace-pre px-2 ${
                                            isAdded
                                                ? "text-green-700 dark:text-green-400"
                                                : isRemoved
                                                  ? "text-red-700 dark:text-red-400"
                                                  : ""
                                        }`}
                                    >
                                        {highlightText(
                                            line.content,
                                            search,
                                        )}
                                    </code>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CodeCommitBlock