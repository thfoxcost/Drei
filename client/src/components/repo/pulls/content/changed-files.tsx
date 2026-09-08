import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
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
import { Diff, Ellipsis, GitCommitHorizontal, PanelRightOpen } from "lucide-react";

const commits = [
    {
        author: "thefoxcost",
        avatar: "https://github.com/shadcn.png",
        fallback: "CN",
        message: "Fix commit page layout and improve changed files UI",
        hash: "c33e686",
    },
    {
        author: "vercel",
        avatar: "https://github.com/vercel.png",
        fallback: "VC",
        message: "Update repository navigation and sidebar behavior",
        hash: "a82f19d",
    },
    {
        author: "torvalds",
        avatar: "https://github.com/torvalds.png",
        fallback: "LT",
        message: "Refactor commit diff rendering",
        hash: "7be42c1",
    },
    {
        author: "gaearon",
        avatar: "https://github.com/gaearon.png",
        fallback: "GA",
        message: "Improve component rendering performance",
        hash: "f19d3a8",
    },
    {
        author: "yyx990803",
        avatar: "https://github.com/yyx990803.png",
        fallback: "YY",
        message: "Update dependencies and clean up unused imports",
        hash: "42dc7e5",
    },
    {
        author: "sindresorhus",
        avatar: "https://github.com/sindresorhus.png",
        fallback: "SO",
        message: "Add missing tests for commit components",
        hash: "91ac4f2",
    },
]

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
    const offset = circumference - (value / 100) * circumference

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
                className="stroke-green-600 dark:stroke-green-500"
            />
        </svg>
    )
}

function Changedfiles() {
    return (
        <div className="flex w-full items-center justify-between bg-background">
            {/* Left */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                >
                    <PanelRightOpen className="size-4" />

                    <span className="sr-only">
                        Toggle changed files
                    </span>
                </Button>

                <div className="flex items-center gap-2">
                    <Diff className="size-4 text-muted-foreground" />

                    <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-orange-500">
                            17 changed files
                        </span>{" "}
                        with{" "}
                        <span className="font-semibold text-green-600 dark:text-green-500">
                            966 additions
                        </span>{" "}
                        and{" "}
                        <span className="font-semibold text-red-600 dark:text-red-500">
                            122 deletions
                        </span>
                    </span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Review progress */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex cursor-default items-center gap-1.5">
                            <CircularProgress
                                value={(10 / 17) * 100}
                                size={16}
                                strokeWidth={2}
                            />

                            <span className="text-xs text-muted-foreground">
                                10 of 17
                            </span>
                        </div>
                    </TooltipTrigger>

                    <TooltipContent>
                        <p>Viewing progress</p>
                    </TooltipContent>
                </Tooltip>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Ellipsis className="size-4" />
                            <span className="sr-only">More options</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-45">
                        <DropdownMenuItem>
                            Download Diff files
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            Expand all files
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            Collapse all files
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            Download path file
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
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
                                {commits.length} commits
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {commits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                                    <GitCommitHorizontal className="size-5 text-muted-foreground" />
                                </div>

                                <p className="text-sm font-medium">
                                    No commits found
                                </p>

                                <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
                                    There are no commits to display for this
                                    pull request.
                                </p>
                            </div>
                        ) : (
                            commits.map((commit, index) => (
                                <React.Fragment key={commit.hash}>
                                    <DropdownMenuItem className="flex items-center gap-2">
                                        <Avatar className="size-6 shrink-0">
                                            <AvatarImage
                                                src={commit.avatar}
                                                alt={commit.author}
                                            />

                                            <AvatarFallback>
                                                {commit.fallback}
                                            </AvatarFallback>
                                        </Avatar>

                                        <span className="shrink-0 font-semibold">
                                            {commit.author}
                                        </span>

                                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                            {commit.message}
                                        </span>

                                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                            {commit.hash}
                                        </span>
                                    </DropdownMenuItem>

                                    {index < commits.length - 1 && (
                                        <DropdownMenuSeparator />
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button className="bg-green-600 text-white hover:bg-green-700">
                    Submit review
                    <svg className="size-1.5 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 616 614"><path fill="currentColor" d="m602.442 200l-253 317c-24 29-61 29-84 0l-253-317c-24-30-12-53 25-53h540c38 0 49 23 25 53"/></svg>
                </Button>
            </div>
        </div>
    )
}

export default Changedfiles
