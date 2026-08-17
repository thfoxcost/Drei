import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"

interface LatestcommitsboxProps {
  author?: string
  message?: string
  hash?: string
  date?: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ""

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`

  const month = months[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()

  if (year === now.getFullYear()) {
    return `${month} ${day}`
  }
  return `${month} ${day}, ${year}`
}

function Latestcommitsbox({ author, message, hash, date }: LatestcommitsboxProps) {
  const shortHash = hash ? hash.slice(0, 7) : ""
  const displayDate = date ? formatDate(date) : ""

  return (
    <div className="border rounded-md p-2 text-sm flex flex-row items-center justify-between">
      <div className="flex flex-row gap-2">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>{author ? author.slice(0, 2).toUpperCase() : "U"}</AvatarFallback>
        </Avatar>
        <span className="text-semibold hover:underline">{author}</span>
        <span className="text-muted-foreground hover:underline hover:text-blue-500 cursor-pointer">
          {message}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">
        {displayDate && `${displayDate} `}
        {shortHash && `\u00b7 ${shortHash}`}
      </span>
    </div>
  )
}

export default Latestcommitsbox
