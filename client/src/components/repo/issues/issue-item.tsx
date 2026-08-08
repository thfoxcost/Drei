import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { CircleDot } from "lucide-react"

interface IssueComment {
  id: number
  body: string
  createdAt: string
  updatedAt: string
  createdBy: number
}

interface IssueItemProps {
  title: string
  assignedTo: number | null
  number: number
  state: string
  description: string
  author: number
  tags: string[]
  createdAt: string
  updatedAt: string
  closedAt: string | null
  closedBy: number | null
  comments: IssueComment[]
}

function IssueItem({
  title,
  assignedTo,
  number,
  state,
  description,
  author,
  tags,
  createdAt,
  updatedAt,
  closedAt,
  closedBy,
  comments,
}: IssueItemProps) {
  return (
    <div className="group flex flex-row items-center gap-3 border-b p-3 transition-colors hover:bg-muted/50">
      <CircleDot
        size={18}
        className={
          state === "open"
            ? "text-green-500"
            : "text-muted-foreground"
        }
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="cursor-pointer truncate font-semibold hover:text-blue-400 hover:underline">
            {title}
          </span>

          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          #{number} · {author} opened {createdAt}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {assignedTo && (
          <Avatar
            size="sm"
            className="transition-transform group-hover:scale-105"
          >
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt={`User ${assignedTo}`}
            />
            <AvatarFallback>{assignedTo}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

export default IssueItem