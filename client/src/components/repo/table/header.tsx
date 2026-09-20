import { Button } from "#/components/ui/button"
import { Spinner } from "#/components/ui/spinner"
import { UserAvatar } from "#/components/UserAvatar"
import { useRepoData } from "#/hooks/useRepoData"
import { absoluteDate, timeAgo } from "#/lib/time-ago"
import { useParams } from "@tanstack/react-router"
import { RotateCcwClock } from "lucide-react"

function Mainheader({ branch }: { branch?: string }) {
    const { username, repo } = useParams({ strict: false });
    const { data: repoData, isLoading } = useRepoData(username, repo, branch)

    if (isLoading || !repoData) {
        return (
            <div className="mt-4 flex items-center justify-center rounded-t-sm border bg-muted/40 px-2 py-4">
                <Spinner />
            </div>
        )
    }

    const { lastCommit, commits, contributors } = repoData
    const commitAuthor = contributors.find(
        (c) => c.username === lastCommit.author
    )

    return (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-t-sm border bg-muted/40 px-2 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <UserAvatar
                    src={commitAuthor?.avatar}
                    name={lastCommit.author}
                    size="sm"
                />

                <p className="shrink-0 text-sm font-medium text-foreground hover:underline">
                    {lastCommit.author}
                </p>

                <span
                    className="truncate text-sm text-muted-foreground"
                    title={lastCommit.message}
                >
                    {lastCommit.message}
                </span>
            </div>

            <div className="flex shrink-0 items-center gap-5">
                <span
                    className="whitespace-nowrap text-xs text-muted-foreground"
                    title={absoluteDate(lastCommit.date)}
                >
                    {lastCommit.hash.slice(0, 7)} - {timeAgo(lastCommit.date)}
                </span>

                <div className="flex items-center gap-1">
                    <a href={`/${username}/${repo}/commits`}>
                        <Button variant="ghost" >
                            <RotateCcwClock
                                size={15}
                                className="text-muted-foreground"
                            />
                            <span className="whitespace-nowrap text-xs">
                                {commits.length.toLocaleString()} Commits
                            </span>
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Mainheader