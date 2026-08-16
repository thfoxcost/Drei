import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"

function Latestcommitsbox() {
    return (
        <div className="border rounded-md p-2 text-sm flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
                <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span className="text-semibold hover:underline">thefoxcost</span>
                <span className="text-muted-foreground hover:underline hover:text-blue-500 cursor-pointer">feat: enhance README and documentation structure with new files</span>
            </div>
            <span className="text-muted-foreground text-xs">2518c27 · 2 weeks ago</span>
        </div> 
    )
}

export default Latestcommitsbox