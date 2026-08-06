import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pattern } from "@/components/mode-toggle"
import { authClient } from "#/lib/auth-client"
import {
    ArrowLeftRight,
    Bell,
    BookMarked,
    BookPlus,
    Bug,
    Building2,
    CircleQuestionMark,
    GitPullRequest,
    Inbox,
    LogOut,
    Menu,
    Settings,
    User,
} from "lucide-react"
import { Cmd } from "./cmd"
import { UserAvatar } from "@/components/UserAvatar"

const NAV_ITEMS = [
    { label: "Issues", icon: Bug },
    { label: "PRs", icon: GitPullRequest },
    { label: "Notifications", icon: Bell },
    { label: "Repositories", icon: BookMarked },
]

export default function Header() {
    const { data: session } = authClient.useSession()

    return (
        <header className="flex items-center justify-between gap-2 bg-muted/10 border-b px-3 py-2 sm:px-2 sm:py-1">
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


                <Pattern />

                <Separator
                    orientation="vertical"
                    className="hidden h-6 self-center sm:block mt-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring">
                            <UserAvatar
                                src={session?.user.image}
                                name={session?.user.name}
                            />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-64" align="end">
                        <DropdownMenuLabel className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    src={session?.user.image}
                                    name={session?.user.name}
                                />

                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate font-semibold">
                                        {session?.user.name ?? "Unknown User"}
                                    </span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        @{session?.user.name}
                                    </span>
                                </div>
                            </div>

                            <Button variant="ghost" size="icon">
                                <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuItem disabled>
                            🌴 Still learning
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem>
                            <User className="mr-1 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            <BookMarked className="mr-1 h-4 w-4" />
                            Repositories
                        </DropdownMenuItem>

                        <DropdownMenuItem disabled>
                            <Inbox className="mr-1 h-4 w-4" />
                            Notifications
                        </DropdownMenuItem>


                        <DropdownMenuItem disabled>
                            <Building2 className="mr-1 h-4 w-4" />
                            Organizations
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem disabled>
                            <Settings className="mr-1 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>


                        <DropdownMenuItem disabled>
                            <CircleQuestionMark className="mr-1 h-4 w-4" />
                            Help
                        </DropdownMenuItem>


                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                                await authClient.signOut();
                            }}
                        >
                            <a href="/" className="flex items-center gap-1 text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </a>

                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}