import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pattern } from "@/components/mode-toggle"
import { authClient } from "#/lib/auth-client"
import {
    Bell,
    BookMarked,
    BookPlus,
    Bug,
    GitPullRequest,
    Menu,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Cmd } from "./cmd"

const NAV_ITEMS = [
    { label: "Issues", icon: Bug },
    { label: "PRs", icon: GitPullRequest },
    { label: "Notifications", icon: Bell },
    { label: "Repositories", icon: BookMarked },
]

export default function Header() {
    const { data: session } = authClient.useSession()

    return (
        <header className="flex items-center justify-between gap-2 bg-muted/10  px-3 py-2 sm:px-2 sm:py-1">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <img
                    draggable={false}
                    src="/logo-light.svg"
                    alt="Logo"
                    className="block h-6 w-6 shrink-0 dark:hidden sm:h-9 sm:w-9 md:h-[50px] md:w-[50px]"
                />

                <img
                    draggable={false}
                    src="/logo-dark.svg"
                    alt="Logo"
                    className="hidden h-6 w-6 shrink-0 dark:block sm:h-9 sm:w-9 md:h-[50px] md:w-[50px]"
                />

                <nav className="hidden items-center gap-1 pb-1 md:flex">
                    {NAV_ITEMS.map(({ label, icon: Icon }) => (
                        <Button key={label} variant="link" disabled>
                            <Icon />
                            {label}
                        </Button>
                    ))}
                </nav>

                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {NAV_ITEMS.map(({ label, icon: Icon }) => (
                                <DropdownMenuItem key={label} disabled>
                                    <Icon className="mr-2 h-4 w-4" />
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>



            <div className="flex items-center gap-1 sm:gap-3">
                <div className="">
                    <Cmd />
                </div>
                <a href="/new">
                    <Button size="default" >
                        <BookPlus className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Create</span>
                    </Button>
                </a>

                <Button size="icon" aria-label="Search" variant="outline" disabled>
                    <Bell aria-hidden="true" />
                </Button>

                <Pattern />

                <Separator
                    orientation="vertical"
                    className="hidden h-6 self-center sm:block mt-1" />

                <Tooltip>
                    <TooltipTrigger>
                        <Avatar className="mr-1">
                            <AvatarImage
                                src={session?.user.image ?? import.meta.env.VITE_DEFAULT_AVATAR_URL}
                                alt={session?.user.name ?? "User"}
                            />
                            <AvatarFallback>
                                {session?.user.name
                                    ?.split(" ")
                                    .map((word) => word[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase() ?? "??"}
                            </AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-semibold">@{session?.user.name}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </header>
    )
}