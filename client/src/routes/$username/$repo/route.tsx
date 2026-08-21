import { Outlet, createFileRoute } from "@tanstack/react-router"
import ReposMainHeader from "#/components/repo/Repos-main-header"
import RepoTabs from "#/components/repo/repo-tabs"
import { authMiddleware } from "#/lib/middleware"
import { useRepoData } from "#/hooks/useRepoData"
import { authClient } from "#/lib/auth-client"
import { NotFoundPage } from "@/components/not-found"

export const Route : any = createFileRoute("/$username/$repo")({
  component: RepositoryLayout,
  server: {
    middleware: [authMiddleware],
  }
})

function RepositoryLayout() {
  const { username, repo } = Route.useParams()
  const { data: session } = authClient.useSession()
  const { data: repoData, isLoading } = useRepoData(username, repo)

  if (!isLoading && repoData) {
    const userId = session?.user?.id
    const isPrivate = !repoData.visibility

    if (isPrivate) {
      const isOwner = userId === repoData.ownerId
      const isContributor = repoData.contributors.some(
        (c) => c.id === userId,
      )

      if (!isOwner && !isContributor) {
        return <NotFoundPage />
      }
    }
  }

  return (
    <>
      <ReposMainHeader username={username} repo={repo} />
      <RepoTabs owner={username} repo={repo}/>
      <Outlet />
    </>
  )
}