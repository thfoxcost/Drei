import { Button } from "#/components/ui/button"
import { UserAvatar } from "#/components/UserAvatar"
import { authClient } from "#/lib/auth-client"
import { absoluteDate, timeAgo } from "#/lib/time-ago"
import { useParams } from "@tanstack/react-router"
import { ClockFading, RotateCcwClock } from "lucide-react"

interface MainheaderProps {
    owner: string
    lastcommit: string
    commithash: string
    commitDate: string
    commitNum: string
}

function Mainheader({
    owner,
    lastcommit,
    commithash,
    commitDate,
    commitNum,
}: MainheaderProps) {
    const { username, repo } = useParams({ strict: false });
    const { data: session } = authClient.useSession()
    return (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-t-sm border bg-muted/40 px-2 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <UserAvatar
                    src={session?.user.image}
                    name={owner}
                    size="sm"
                />

                <p className="shrink-0 text-sm font-medium text-foreground hover:underline">
                    {owner}
                </p>

                <span
                    className="truncate text-sm text-muted-foreground"
                    title={lastcommit}
                >
                    {lastcommit}
                </span>
            </div>

            <div className="flex shrink-0 items-center gap-5">
                <span
                    className="whitespace-nowrap text-xs text-muted-foreground"
                    title={absoluteDate(commitDate)}
                >
                    {commithash} - {timeAgo(commitDate)}
                </span>

                <div className="flex items-center gap-1">
                    <a href={`/${username}/${repo}/commits`}>
                        <Button variant="ghost" >
                            <RotateCcwClock
                                size={15}
                                className="text-muted-foreground"
                            />
                            <span className="whitespace-nowrap text-xs">
                                {commitNum} Commits
                            </span>
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Mainheader