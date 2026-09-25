import Actions from '#/components/repo/empty-pages/actions'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/actions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Actions /></div>
}
