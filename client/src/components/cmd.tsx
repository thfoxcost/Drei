"use client"

import { useState } from "react"
import { Badge } from "@/components/reui/badge"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { FolderGit2Icon, SearchIcon } from 'lucide-react'


// replace by repositories
const repositories = [
  { name: "next.js", path: "vercel/next.js", type: "TypeScript" },
  { name: "react", path: "facebook/react", type: "JavaScript" },
  { name: "tailwindcss", path: "tailwindlabs/tailwindcss", type: "CSS" },
  { name: "shadcn-ui", path: "shadcn-ui/ui", type: "TypeScript" },
  { name: "radix-ui", path: "radix-ui/primitives", type: "TypeScript" },
  { name: "zod", path: "colinhacks/zod", type: "TypeScript" },
  { name: "prisma", path: "prisma/prisma", type: "Rust" },
  { name: "turborepo", path: "vercel/turborepo", type: "Rust" },
]

export function Cmd() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-52">
        <SearchIcon className="size-4" />
        Search repositories...
        <Kbd className="ml-auto px-3">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="**:data-[selected=true]:bg-muted **:data-selected:bg-transparent">
          <CommandInput placeholder="Search repos..."   className="placeholder:text-muted-foreground"/>
          <CommandList>
            <CommandEmpty>No repositories found.</CommandEmpty>
            <CommandGroup heading="Repositories">
              {repositories.map((repo) => (
                <CommandItem key={repo.path} className="gap-2.5">
                  <FolderGit2Icon className="size-4 shrink-0" />
                  <div className="flex flex-1 items-center gap-2">
                    <span className="font-medium">{repo.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {repo.path}
                    </span>
                  </div>
                  <div className="ml-auto" data-slot="command-shortcut">
                    <Badge variant="outline" size="sm">
                      {repo.type}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}