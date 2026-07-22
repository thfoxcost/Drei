    import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

import { Pattern } from "@/components/mode-toggle"
import { authClient } from "#/lib/auth-client"
import { Cmd } from "./cmd"

import {
  Inbox,
  BookPlus,
  GitPullRequest,
  CircleDot,
} from "lucide-react"

export default function ReposMainHeader() {
  const { data: session } = authClient.useSession()
    //   const { repo } = Route.useParams()
    const repo = "test"
    // this is important but u should make the dynamic routing first
  return (
    <header className="flex items-center justify-between gap-2 bg-muted/10 px-3 py-2 sm:px-2 sm:py-1">
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



        <p className="hidden text-sm font-semibold sm:block ">{session?.user?.name} / {repo}</p>
        {/* this will be the repo name from params */}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Cmd />

        <a href="/new">
          <Button>
            <BookPlus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </a>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              aria-label="Pull Requests"
              disabled
            >
              <GitPullRequest className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pull Requests</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              aria-label="Issues"
              disabled
            >
              <CircleDot className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Issues</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              aria-label="Inbox"
              disabled
            >
              <Inbox className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Inbox</p>
          </TooltipContent>
        </Tooltip>

        <Pattern />

        <Separator
          orientation="vertical"
          className="hidden h-6 self-center sm:block mt-1"
        />

        <Tooltip>
          <TooltipTrigger>
            <Avatar className="mr-1">
              <AvatarImage
                src={
                  session?.user.image ??
                  import.meta.env.VITE_DEFAULT_AVATAR_URL
                }
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