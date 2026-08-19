import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "@tanstack/react-router"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pattern } from "@/components/mode-toggle"
import { authClient } from "#/lib/auth-client"
import type { LucideIcon } from "lucide-react"
import {
    ArrowLeftRight,
    Bell,
    BookMarked,
    BookPlus,
    Bug,
    Building2,
    CircleQuestionMark,
    GitPullRequest,
    LogOut,
    Menu,
    Plus,
    Settings,
    User,
} from "lucide-react"
import { Cmd } from "./cmd"
import { UserAvatar } from "@/components/UserAvatar"

const NAV_ITEMS: {
    label: string
    icon: LucideIcon
    to?: "/repos" | "/issues"
    disabled?: boolean
}[] = [
        { label: "Repositories", icon: BookMarked, to: "/repos" },
        { label: "Issues", icon: Bug, to: "/issues" },
        { label: "PRs", icon: GitPullRequest, disabled: true },
        { label: "Notifications", icon: Bell, disabled: true },
    ]

const ORGANIZATIONS = [
    {
        name: "Kernwerk",
        avatar: "https://api.dicebear.com/10.x/planets/svg?seed=Felix",
        teams: ["Engineering", "Design", "Infrastructure"],
    },
    {
        name: "Wolkenwerk",
        avatar: "https://api.dicebear.com/10.x/planets/svg?seed=sh92f3ya",
        teams: ["Development", "Security"],
    },
    {
        name: "Eisenfeld",
        avatar: "https://api.dicebear.com/10.x/planets/svg?seed=2zyz4h37",
        teams: ["Core", "Frontend", "Backend", "DevOps"],
    },
]

export default function Header() {
    const { data: session } = authClient.useSession()
    const navigate = useNavigate()

    return (
        <header className="flex items-center justify-between gap-2 border-b bg-muted/10 px-3 py-2 sm:px-2 sm:py-1">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Link to="/" aria-label="Home">
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
                </Link>

                <nav className="hidden items-center gap-1 pb-1 md:flex">
                    {NAV_ITEMS.map(({ label, icon: Icon, to, disabled }) =>
                        to ? (
                            <Button key={label} variant="ghost" asChild>
                                <Link to={to}>
                                    <Icon />
                                    {label}
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                key={label}
                                variant="ghost"
                                disabled={disabled}
                            >
                                <Icon />
                                {label}
                            </Button>
                        ),
                    )}
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
                            {NAV_ITEMS.map(
                                ({ label, icon: Icon, to, disabled }) => (
                                    <DropdownMenuItem
                                        key={label}
                                        disabled={disabled}
                                        onClick={() =>
                                            to && navigate({ to })
                                        }
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        {label}
                                    </DropdownMenuItem>
                                ),
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
                <div>
                    <Cmd />
                </div>

                <a href="/new">
                    <Button size="default">
                        <BookPlus className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Create</span>
                    </Button>
                </a>

                <Pattern />

                <Separator
                    orientation="vertical"
                    className="mt-1 hidden h-6 self-center sm:block"
                />

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
                                    <span className="truncate font-semibold text-sm text-foreground">
                                        {session?.user.name ?? "Unknown User"}
                                    </span>

                                    <span className="truncate text-xs text-muted-foreground">
                                        @{session?.user.name}
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    await authClient.signOut()
                                    window.location.href = "/"
                                }}
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                        </DropdownMenuLabel>

                        <DropdownMenuItem disabled>
                            🌴 Still learning
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                            <a href="/">
                                <User className="mr-1 h-4 w-4" />
                                Profile
                            </a>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <a href="/repos">
                                <BookMarked className="mr-1 h-4 w-4" />
                                Repositories
                            </a>
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Building2 className="mr-1 h-4 w-4" />
                                Organizations
                            </DropdownMenuSubTrigger>

                            <DropdownMenuSubContent className="w-56">
                                {ORGANIZATIONS.map((organization) => (
                                    <DropdownMenuItem
                                        key={organization.name}
                                    >
                                        <img
                                            src={organization.avatar}
                                            alt={`${organization.name} avatar`}
                                            className="mr-2 h-5 w-5 shrink-0 rounded-md object-cover"
                                        />

                                        <span className="truncate">
                                            {organization.name}
                                        </span>

                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {organization.teams.length}
                                        </span>
                                    </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add new organization
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                            <a href="/settings">
                                <Settings className="mr-1 h-4 w-4" />
                                Settings
                            </a>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <a
                                href="https://github.com/thfoxcost/Drei"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <CircleQuestionMark className="mr-1 h-4 w-4" />
                                Help
                            </a>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                                await authClient.signOut()
                            }}
                        >
                            <a
                                href="/"
                                className="flex items-center gap-1 text-destructive"
                            >
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