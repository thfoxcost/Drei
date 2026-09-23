import Security from '#/components/repo/empty-pages/security'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/security')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Security />
  </div>
}
