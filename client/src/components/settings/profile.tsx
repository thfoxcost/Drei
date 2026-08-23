import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

function ProfileHeader() {
    return (
        <div className="flex flex-row gap-3 items-center  mb-5">
            <Avatar className="size-9">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-start gap-0">
                <span className="font-semibold">thefoxcost <span className="text-muted-foreground">(thfoxcost)</span></span>
                <span className="text-muted-foreground text-xs">Your personal account</span>
            </div>
        </div>
    )
}

export default ProfileHeader