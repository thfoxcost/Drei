import { Avatar, AvatarImage } from "#/components/ui/avatar"
import { absoluteDate, timeAgo } from "#/lib/time-ago";
import { ClockFading } from 'lucide-react';
interface MainheaderProps {
    owner: string
    lastcommit: string
    commithash: string
    commitDate: string
    commitNum: string
}


function Mainheader({ owner, lastcommit, commithash, commitDate, commitNum }: MainheaderProps) {
    timeAgo(commitDate)
    return (
        <div className="flex items-center justify-between gap-2 mt-7 bg-muted/40 rounded-t-sm px-3 py-3 border">
            <div className="flex items-center gap-2">
                <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" />
                </Avatar>
                <p className="font-medium hover:underline text-foreground text-sm">{owner}</p>
                <span className="text-muted-foreground text-sm">{lastcommit}</span>
            </div>
            <div className="flex items-center gap-5">
                <span className="text-muted-foreground text-xs" title={absoluteDate(commitDate)}>
                    {commithash} - {timeAgo(commitDate)}
                </span>
                <div className="flex items-center gap-1">
                    <ClockFading size={16} className="text-muted-foreground" />
                    <span className="text-xs">
                        {commitNum} Commits
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Mainheader