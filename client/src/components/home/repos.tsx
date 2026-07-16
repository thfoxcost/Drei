import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function RepoCard({ repo }: { repo: (typeof repos)[number] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="link" className="h-auto p-0 text-xl font-semibold">
            {repo.name}
          </Button>

          <Badge variant="outline">{repo.owner}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {repo.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {repo.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
          <Prevlang
            language={repo.language}
            color={repo.languageColor}
          />
          <Stars count={repo.stars} />
          <Forks count={repo.forks} />
          <License license={repo.license} />
          <LastUpdate updated={repo.updated} />
        </div>
      </div>
    </div>
  )
}

function Repos() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-1 xl:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.name} repo={repo} />
      ))}
    </div>
  )
}

export default Repos