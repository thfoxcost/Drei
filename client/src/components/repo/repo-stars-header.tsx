import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "@/components/ui/button"
import { StartsBtn } from "./stars-btn"
import { CloudBackup, Earth } from "lucide-react"
import { ForksBtn } from "./forks-btn"
import { Badge } from "../ui/badge"

interface RepoStarsheaderProps {
    reponame: string
}
function RepoStarsheader({ reponame }: RepoStarsheaderProps) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Avatar className='rounded-full after:rounded-[inherit]'>
                    <AvatarImage
                        src='http://localhost:3000/lofichr.png'
                        alt='avatar'
                        className='rounded-full'
                    />
                    <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <p className="font-semibold hover:underline text-foreground">{reponame}</p>
                <Badge variant="secondary">
                    <Earth data-icon="inline-start" />
                    Public
                </Badge>
            </div>
            <div className="flex items-center gap-2">
                <StartsBtn />
                <ForksBtn />
                <Button variant="outline">
                    <CloudBackup />
                    Backup
                </Button>
            </div>
        </div>
    )
}

export default RepoStarsheader