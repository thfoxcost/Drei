import { useState } from "react"
import { useLocation } from "@tanstack/react-router"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CodeBlockProps = {
  className?: string
  commands?: string[]
}

export function CodeBlock({ className, commands }: CodeBlockProps) {
  const location = useLocation()
  // e.g. "/thfoxcost/curly-potato" -> ["thfoxcost", "curly-potato"]
  const [username, repo] = location.pathname.split("/").filter(Boolean)

  const lines = commands ?? [
    `echo "# ${repo}" >> README.md`,
    "git init",
    "git add README.md",
    `git commit -m "first commit"`,
    "git branch -M main",
    `git remote add origin http://localhost:3200/git/${username}/${repo}.git`,
    "git push -u origin main",
  ]

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "relative inline-block w-fit rounded-lg border bg-zinc-950",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        <span className="sr-only">Copy</span>
      </Button>

      <pre className="overflow-x-auto p-4 pr-12 text-left">
        <code className="grid text-left font-mono text-sm text-zinc-100">
          {lines.map((line, i) => (
            <span key={i} className={cn("whitespace-pre")}>
              <span className="mr-2 select-none text-zinc-500">$</span>
              {line}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

export default CodeBlock