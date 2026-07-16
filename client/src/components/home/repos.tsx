"use client"

import { useMemo, useState } from "react"
import { Search, BookMarked, FolderSearch } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import {
  Prevlang,
  Stars,
  Forks,
  License,
  LastUpdate,
} from "@/components/preview-details"

const repos = [
  {
    name: "React",
    owner: "Private",
    description: "A JavaScript library for building user interfaces",
    tags: ["React", "JavaScript", "UI", "Components", "DOM"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 239812,
    forks: 50231,
    license: "MIT License",
    updated: "2 days ago",
  },
  {
    name: "Next.js",
    owner: "Public",
    description: "The React Framework for Production",
    tags: ["React", "SSR", "Next.js"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 132450,
    forks: 28450,
    license: "MIT License",
    updated: "1 day ago",
  },
  {
    name: "Vue",
    owner: "Public",
    description: "The Progressive JavaScript Framework",
    tags: ["Vue", "JavaScript", "Frontend"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 210431,
    forks: 35219,
    license: "MIT License",
    updated: "3 days ago",
  },
  {
    name: "Angular",
    owner: "Public",
    description: "Platform for building web applications",
    tags: ["Angular", "TypeScript"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 98021,
    forks: 26318,
    license: "MIT License",
    updated: "5 days ago",
  },
  {
    name: "Svelte",
    owner: "Private",
    description: "Cybernetically enhanced web apps",
    tags: ["Svelte", "Compiler"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 86520,
    forks: 4210,
    license: "MIT License",
    updated: "6 hours ago",
  },
  {
    name: "SolidJS",
    owner: "Public",
    description: "Simple and performant reactivity",
    tags: ["Solid", "JSX"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 39102,
    forks: 1234,
    license: "MIT License",
    updated: "4 days ago",
  },
]

type Repo = (typeof repos)[number]

function RepoCard({ repo }: { repo: Repo }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <BookMarked
            size={18}
            className="shrink-0 text-muted-foreground"
          />
          <span className="truncate text-lg font-semibold group-hover:underline">
            {repo.name}
          </span>
          <Badge variant="outline" className="shrink-0">
            {repo.owner}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {repo.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {repo.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">
          <Prevlang language={repo.language} color={repo.languageColor} />
          <Stars count={repo.stars} />
          <Forks count={repo.forks} />
          <License license={repo.license} />
          <LastUpdate updated={repo.updated} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
      <FolderSearch className="text-muted-foreground" size={28} />
      <p className="text-sm font-medium">No repositories found</p>
      <p className="text-sm text-muted-foreground">
        Nothing matches &ldquo;{query}&rdquo;. Try a different name, tag, or
        language.
      </p>
    </div>
  )
}

function Repos() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repos

    return repos.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(q) ||
        repo.description.toLowerCase().includes(q) ||
        repo.language.toLowerCase().includes(q) ||
        repo.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [query])

  return (
    <div className="space-y-3 p-2">
      <InputGroup className="mb-5.5 w-full">
        <InputGroupInput
          placeholder="Search repositories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <InputGroupAddon>
          <Search size={16} />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </InputGroupAddon>
      </InputGroup>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 xl:grid-cols-2">
        {filtered.length > 0 ? (
          filtered.map((repo) => <RepoCard key={repo.name} repo={repo} />)
        ) : (
          <EmptyState query={query} />
        )}
      </div>
    </div>
  )
}

export default Repos