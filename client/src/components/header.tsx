import { useEffect, useState } from "react"
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
import { authClient } from "#/lib/auth-client"
import { backendUrl } from "#/lib/backend-url"
import { useUserOrganizations } from "@/hooks/useOrganizations"
import { ORGANIZATIONS } from "@/data/organizations"
import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeftRight,
  BookMarked,
  BookPlus,
  Bug,
  Plus,
  Building2,
  CircleQuestionMark,
  GitPullRequest,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react"
import { Cmd } from "./cmd"
import { UserAvatar } from "@/components/UserAvatar"
import { PeopleIcon } from "@/components/people-icon"
import { CopyIcon } from "@/components/copy-icon"
import { useTodo } from "@/components/todo-provider"
import { useTodosEnabled } from "#/hooks/useAppearanceSettings"

const NAV_ITEMS: {
  label: string
  icon: LucideIcon | ComponentType<{ className?: string }>
  to: "/repos" | "/issues" | "/orgs" | "/pulls" | "/people"
  disabled?: boolean
}[] = [
    { label: "Repositories", icon: BookMarked, to: "/repos" },
    { label: "Issues", icon: Bug, to: "/issues" },
    { label: "Pulls", icon: GitPullRequest, to: "/pulls" },
    { label: "Organizations", icon: Building2, to: "/orgs" },
    { label: "People", icon: PeopleIcon, to: "/people" },
  ]

export default function Header() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const { toggle } = useTodo()
  const todosEnabled = useTodosEnabled()
  const [biography, setBiography] = useState<string | null>(null)
  const { data: orgs, isError: orgsError } = useUserOrganizations()
  const organizationList = orgsError ? ORGANIZATIONS : (orgs ?? [])

  useEffect(() => {
    async function fetchBiography() {
      try {
        const res = await fetch("http://localhost:3200/api/profile", {
          credentials: "include",
        })

        if (res.ok) {
          const data = await res.json()
          setBiography(data.biography ?? null)
        }
      } catch {
        // Silently ignore — biography is non-critical
      }
    }

    fetchBiography()
  }, [])

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
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <Button key={label} variant="ghost" asChild>
              <Link to={to}>
                <Icon />
                {label}
              </Link>
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
              {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
                <DropdownMenuItem
                  key={label}
                  onClick={() => to && navigate({ to })}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </DropdownMenuItem>
              ))}
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

        {todosEnabled && (
          <Button
            variant="outline"
            size="icon"
            aria-label="Search"
            onClick={toggle}
          >
            <CopyIcon />
          </Button>
        )}

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
              <div className="flex items-center gap-2">
                <UserAvatar
                  className="size-9"
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

            <DropdownMenuItem asChild>
              <a href="/settings" className="truncate">
                {biography || "No biography yet"}
              </a>
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
                {organizationList.map((org) => (
                  <DropdownMenuItem
                    key={org.slug}
                    onClick={() =>
                      navigate({
                        to: "/orgs/$org",
                        params: { org: org.slug },
                      })
                    }
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    {org.name}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() =>
                    navigate({
                      to: "/orgs/new",
                    })
                  }
                >
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

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CircleQuestionMark className="mr-1 h-4 w-4" />
                Help
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="w-40">
                <DropdownMenuItem asChild>
                  <a
                    href={`${backendUrl()}/swagger/index.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                      className="h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        d="M16 0C7.177 0 0 7.177 0 16s7.177 16 16 16s16-7.177 16-16S24.823 0 16 0m0 1.527c7.995 0 14.473 6.479 14.473 14.473S23.994 30.473 16 30.473S1.527 23.994 1.527 16S8.006 1.527 16 1.527m-4.839 6.296c-.188-.005-.375 0-.568.005c-1.307.079-2.093.693-2.312 1.964c-.151.891-.125 1.796-.188 2.692a9 9 0 0 1-.156 1.38c-.177.813-.525 1.068-1.353 1.109q-.167.018-.324.057v1.948c1.5.073 1.704.605 1.823 2.172c.048.573-.015 1.147.021 1.719q.042.816.208 1.6c.344 1.432 1.745 1.911 3.433 1.624V22.38c-.272 0-.511.005-.74 0c-.579-.016-.792-.161-.844-.713c-.079-.713-.057-1.437-.099-2.156c-.089-1.339-.235-2.651-1.541-3.5c.672-.495 1.161-1.084 1.312-1.865c.109-.547.177-1.099.219-1.651s-.025-1.12.021-1.667c.077-.885.135-1.249 1.197-1.213c.161 0 .317-.021.495-.036V7.834c-.213 0-.411-.005-.604-.011m10.126.016a5.4 5.4 0 0 0-1.089.079v1.697c.329 0 .584 0 .833.005c.439.005.772.177.813.661c.041.443.041.891.083 1.339c.089.896.136 1.796.292 2.677c.136.724.636 1.265 1.255 1.713c-1.088.729-1.411 1.776-1.463 2.953c-.032.801-.052 1.615-.093 2.427c-.037.74-.297.979-1.043.995c-.208.011-.411.027-.64.041v1.74c.432 0 .833.027 1.235 0c1.239-.073 1.995-.677 2.239-1.885a15 15 0 0 0 .183-2.005c.041-.615.036-1.235.099-1.844c.093-.953.532-1.349 1.484-1.411q.133-.018.267-.057v-1.953c-.161-.021-.271-.037-.391-.041c-.713-.032-1.068-.272-1.251-.948a6.6 6.6 0 0 1-.197-1.324c-.052-.823-.047-1.656-.099-2.479c-.109-1.588-1.063-2.339-2.516-2.38zm-9.188 7.036c-1.432 0-1.536 2.109-.115 2.245h.079a1.103 1.103 0 0 0 1.167-1.037v-.061a1.13 1.13 0 0 0-1.104-1.147zm3.88 0a1.083 1.083 0 0 0-1.115 1.043c0 .036 0 .067.005.104c0 .672.459 1.099 1.147 1.099c.677 0 1.104-.443 1.104-1.136c-.005-.672-.459-1.115-1.141-1.109zm3.948 0a1.15 1.15 0 0 0-1.167 1.115c0 .625.505 1.131 1.136 1.131h.011c.567.099 1.135-.448 1.172-1.104c.031-.609-.521-1.141-1.152-1.141z"
                      />
                    </svg>
                    Swagger
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="https://github.com/thfoxcost/Drei"
                    target="_blank"
                    rel="drei github repo"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2v4q0 1.25.875 2.125T15 9h4v11q0 .825-.587 1.413T17 22H7q-.825 0-1.412-.587T5 20V4q0-.825.588-1.412T7 2zm2 0l5 5h-4q-.425 0-.712-.288T14 6zm-4 17h2q.425 0 .713-.288T13 18t-.288-.712T12 17h-2q-.425 0-.712.288T9 18t.288.713T10 19m0-4h4q.425 0 .713-.288T15 14t-.288-.712T14 13h-4q-.425 0-.712.288T9 14t.288.713T10 15"
                      />
                    </svg>
                    Docs
                  </a>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                await authClient.signOut()
                window.location.href = "/"
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
