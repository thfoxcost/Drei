import { Outlet, createFileRoute } from "@tanstack/react-router"
import ReposMainHeader from "#/components/repo/Repos-main-header"
import RepoTabs from "#/components/repo/repo-tabs"

export const Route : any = createFileRoute("/$username/$repo")({
  component: RepositoryLayout,
})

function RepositoryLayout() {
  const { username, repo } = Route.useParams()

  return (
    <>
      <ReposMainHeader username={username} repo={repo} />
      <RepoTabs />
      <Outlet />
    </>
  )
}