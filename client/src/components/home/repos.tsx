"use client"

import { useMemo, useState } from "react"
import { Search, BookMarked, FolderSearch } from "lucide-react"
import * as linguistLanguages from "linguist-languages"

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


function fallbackColor(name: string) {
  let hash = 0

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360

  return `hsl(${hue}, 65%, 50%)`
}


function getLanguageColor(name: string): string {

  const entry =
    (linguistLanguages as Record<string, { color?: string }>)[name]

  return entry?.color ?? fallbackColor(name)
}



interface Repo {
  name: string
  description: string
  tags: string[]
  language: string
  lastUpdated: string
  stars: number
  forks: number
  license: string
}



interface RepoCardProps {
  repo: Repo
}



function RepoCard({ repo }: RepoCardProps) {


  return (
    <div
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:border-muted-foreground/30 hover:bg-muted/40"
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


          <Badge variant="outline">
            Public
          </Badge>

        </div>



        <p className="text-sm text-muted-foreground">
          {repo.description || "No description"}
        </p>




        <div className="flex flex-wrap gap-1.5">

          {repo.tags.map(tag => (

            <Badge
              key={tag}
              variant="secondary"
            >
              {tag}
            </Badge>

          ))}

        </div>





        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">


          <Prevlang
            language={repo.language}
            color={getLanguageColor(repo.language)}
          />



          <Stars count={repo.stars} />

          <Forks count={repo.forks} />

          <License license={repo.license} />

          <LastUpdate updated={repo.lastUpdated} />


        </div>



      </div>

    </div>
  )
}





function EmptyState({ query }: { query: string }) {

  return (

    <div className="col-span-full flex flex-col
      items-center justify-center gap-2
      rounded-lg border border-dashed border-border
      py-12 text-center">

      <FolderSearch
        className="text-muted-foreground"
        size={28}
      />


      <p className="text-sm font-medium">
        No repositories found
      </p>


      <p className="text-sm text-muted-foreground">
        Nothing matches "{query}"
      </p>


    </div>

  )
}




interface ReposProps {
  repos: Repo[]
}



function Repos({ repos }: ReposProps) {


  const [query, setQuery] = useState("")



  const filtered = useMemo(() => {

    const q = query.trim().toLowerCase()


    if (!q) return repos



    return repos.filter(repo =>

      repo.name.toLowerCase().includes(q)

      ||

      repo.description.toLowerCase().includes(q)

      ||

      repo.tags.some(tag =>
        tag.toLowerCase().includes(q)
      )

      ||

      repo.language.toLowerCase().includes(q)

    )


  }, [query, repos])




  return (

    <div className="space-y-3 p-2">


      <InputGroup className="mb-5.5 w-full">


        <InputGroupInput
          placeholder="Search repositories..."
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />



        <InputGroupAddon>
          <Search size={16}/>
        </InputGroupAddon>



        <InputGroupAddon align="inline-end">

          {filtered.length} result
          {filtered.length === 1 ? "" : "s"}

        </InputGroupAddon>


      </InputGroup>





      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">


        {
          filtered.length > 0

          ?

          filtered.map(repo =>

            <RepoCard
              key={repo.name}
              repo={repo}
            />

          )

          :

          <EmptyState query={query}/>

        }


      </div>


    </div>

  )
}



export default Repos