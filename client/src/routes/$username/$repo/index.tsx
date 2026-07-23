import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { NoRepo } from "#/components/repo/norepo"
import Repo from "#/components/repo/repo"

export const Route = createFileRoute("/$username/$repo/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { username, repo } = Route.useParams()

  const [hasCommits, setHasCommits] = useState<boolean | null>(null)

  useEffect(() => {
    async function isRepoPushed() {
      try {
        const res = await fetch(
          `http://localhost:3200/api/repos/${username}/${repo}`
        )

        if (!res.ok) {
          throw new Error("Failed to fetch repository status")
        }

        const data = await res.json()

        setHasCommits(data.hasCommits)
      } catch (err) {
        console.error(err)
      }
    }

    isRepoPushed()
  }, [username, repo])

  if (hasCommits) {
    return <Repo />
  }

  if (!hasCommits) {
    return <NoRepo />
  }

  return (
    <div>
      this is index.tsx
    </div>
  )
}