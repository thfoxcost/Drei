import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Ellipsis } from "lucide-react"
import { timeAgo } from "@/lib/time-ago"

type CommentItemProps = {
  username: string
  avatarLink?: string
  comment: string
  date: string
}

export default function CommentItem({
  username,
  avatarLink,
  comment,
  date,
}: CommentItemProps) {
  return (
    <div className="flex flex-row gap-4 w-full">
      <Avatar className="size-9">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="relative flex items-center rounded-b-none rounded-sm border border-foreground/30 bg-accent/50 p-1 pl-3">
          <div className="absolute left-[-8px] top-3 z-10 size-0 border-y-[7px] border-r-8 border-y-transparent border-r-foreground/30" />
          <div className="absolute left-[-7px] top-[14px] z-20 size-0 border-y-[6px] border-r-[7px] border-y-transparent border-r-accent/50" />

          <div>
            <span className="relative z-30 font-semibold">
              {username}
            </span>

            <span className="relative z-30 text-muted-foreground">
              {" "}commented{" "}
              <span className="underline text-xs">
                {timeAgo(date)}
              </span>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Ellipsis size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="min-w-35">
                <DropdownMenuItem>
                  Copy link
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Copy Markdown
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Quote Reply
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-b-sm border border-foreground/30 border-t-0 p-4">
          <p className="text-sm">
            {comment}
          </p>
        </div>
      </div>
    </div>
  )
}

type CommitItemMSGProps = {
  username: string
  avatarLink?: string
  message: string
  hash: string
}

export function CommitItemMSG({
  username,
  avatarLink,
  message,
  hash,
}: CommitItemMSGProps) {
  return (
    <div className="flex flex-row items-center gap-2 text-sm ml-13">
      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M0 11.75A.75.75 0 0 1 .75 11h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75m17.5 0a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75"
          />
          <path
            fill="currentColor"
            d="M12 17.75a6 6 0 1 1 0-12a6 6 0 0 1 0 12m0-1.5a4.5 4.5 0 1 0 0-9a4.5 4.5 0 0 0 0 9"
          />
        </svg>
      </div>

      <Avatar className="size-6">
        <AvatarImage src={avatarLink} />
        <AvatarFallback>
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <span className="font-semibold">
        {username}
      </span>

      <p className="text-muted-foreground truncate font-mono text-xs underline underline-offset-2">
        {message}
      </p>

      <span className="text-xs text-muted-foreground font-mono hover:underline cursor-pointer ml-auto">
        {hash}
      </span>
    </div>
  )
}

export function ConversationSheet() {
  return (
    <div className="w-120">
      sd
    </div>
  )
}