import Fork from '#/components/repo/forks/fork'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/forks')({
  component: RouteComponent,
})

function RouteComponent() {
  const { username, repo } = useParams({ from: '/$username/$repo/forks' })

  return (
    <div className="mx-100">
      <Fork owner={username} reponame={repo} />
    </div>
  )
}