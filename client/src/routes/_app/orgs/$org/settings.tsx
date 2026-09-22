import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/orgs/$org/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/orgs/$org/settings"!</div>
}
