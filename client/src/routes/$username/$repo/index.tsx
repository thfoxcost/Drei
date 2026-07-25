import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { NoRepo } from "#/components/repo/norepo"
import Repo from "#/components/repo/repo"
import { Spinner } from "#/components/ui/spinner"

export const Route = createFileRoute("/$username/$repo/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { username, repo } = Route.useParams()

  const [hasCommits, setHasCommits] = useState<boolean | null>(null)

  useEffect(() => {
    setHasCommits(null) // reset to loading state when username/repo changes

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
        setHasCommits(false) // treat fetch errors as "no repo" instead of spinning forever
      }
    }

    isRepoPushed()
  }, [username, repo])

  if (hasCommits === null) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (hasCommits) {
    return <Repo owner={username} repo={repo} />
  }

  return <NoRepo />
}