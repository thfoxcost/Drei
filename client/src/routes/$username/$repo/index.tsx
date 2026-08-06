import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { NoRepo } from "#/components/repo/norepo"
import Repo from "#/components/repo/repo"
import { Spinner } from "#/components/ui/spinner"
import { useRepoData } from "#/hooks/useRepoData"

export const Route = createFileRoute("/$username/$repo/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { username, repo }: { username: string; repo: string } = Route.useParams()
  const { data, isLoading, isError } = useRepoData(username, repo)

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isError && data?.hasCommits) {
    return <Repo owner={username} repo={repo} />
  }

  return <NoRepo />

}