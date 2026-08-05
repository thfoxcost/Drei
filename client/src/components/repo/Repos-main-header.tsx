import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

import { Pattern } from "@/components/mode-toggle"
import { authClient } from "#/lib/auth-client"
import { Cmd } from "../cmd"

import { BookOpen, ChevronDown, CircleDot, FilePlus2, FolderPlus, GitBranchPlus, GitPullRequest, Inbox, PackagePlus, Plus, Tag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"

type ReposMainHeaderProps = {
  username: string
  repo: string
}

export default function ReposMainHeader({
  username,
  repo,
}: ReposMainHeaderProps) {
  const { data: session } = authClient.useSession()

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

        <p className="hidden text-sm font-semibold sm:block">
          {username} / {repo}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Cmd />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <Plus className=" h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create</DropdownMenuLabel>

            <DropdownMenuItem>
              <a href="/new" className="flex items-center gap-1">
                <FolderPlus className="mr-1.5 h-4 w-4" />
                New repository
              </a>

            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled>
              <GitPullRequest className="mr-1.5 h-4 w-4" />
              New pull request
            </DropdownMenuItem>

            <DropdownMenuItem disabled>
              <CircleDot className="mr-1.5 h-4 w-4" />
              New issue
            </DropdownMenuItem>

            <DropdownMenuItem disabled>
              <GitBranchPlus className="mr-1.5 h-4 w-4" />
              New branch
            </DropdownMenuItem>

            <DropdownMenuItem disabled>
              <Tag className="mr-1.5 h-4 w-4" />
              New release
            </DropdownMenuItem>

            <DropdownMenuItem disabled>
              <PackagePlus className="mr-1.5 h-4 w-4" />
              New package
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled>
              <BookOpen className="mr-1.5 h-4 w-4" />
              New wiki
            </DropdownMenuItem>

            <DropdownMenuItem disabled>
              <FilePlus2 className="mr-1.5 h-4 w-4" />
              New gist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>


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