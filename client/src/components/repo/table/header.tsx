import { Avatar, AvatarImage } from "#/components/ui/avatar"
import { authClient } from "#/lib/auth-client"
import { absoluteDate, timeAgo } from "#/lib/time-ago"
import { ClockFading } from "lucide-react"

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
    const { data: session } = authClient.useSession()
    return (
        <div className="mt-7 flex items-center justify-between gap-4 rounded-t-sm border bg-muted/40 px-3 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <Avatar size="sm">
                    <AvatarImage src={
                        session?.user.image ??
                        import.meta.env.VITE_DEFAULT_AVATAR_URL
                    } />
                </Avatar>

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
                    <ClockFading
                        size={16}
                        className="text-muted-foreground"
                    />

                    <span className="whitespace-nowrap text-xs">
                        {commitNum} Commits
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Mainheader