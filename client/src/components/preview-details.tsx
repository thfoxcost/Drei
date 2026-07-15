import { GitFork, Scale, Star } from "lucide-react"

export function Prevlang({
  language,
  color,
}: {
  language: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <p>{language}</p>
    </div>
  )
}

export function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Star className="h-4 w-4" />
      <p>{count.toLocaleString()}</p>
    </div>
  )
}

export function Forks({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <GitFork className="h-4 w-4" />
      <p>{count.toLocaleString()}</p>
    </div>
  )
}

export function License({ license }: { license: string }) {
  return (
    <div className="flex items-center gap-2">
      <Scale className="h-4 w-4" />
      <p>{license}</p>
    </div>
  )
}

export function LastUpdate({ updated }: { updated: string }) {
  return (
    <div className="flex items-center gap-2">
      <p>Updated {updated}</p>
    </div>
  )
} 