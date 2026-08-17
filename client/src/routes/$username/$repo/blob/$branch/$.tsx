import { createFileRoute, useParams } from "@tanstack/react-router"
import Code from "#/components/repo/code/code"

export const Route = createFileRoute("/$username/$repo/blob/$branch/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { branch, _splat } = Route.useParams()
  const { username, repo } = useParams({ strict: false })

  return (
    <Code
      owner={username as string}
      repo={repo as string}
      branch={branch}
      filePath={_splat}
      mode="blob"
    />
  )
}
