import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/prs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$username/$repo/prs"!</div>
}
