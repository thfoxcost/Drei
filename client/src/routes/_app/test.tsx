import Repoheader from '#/components/repo-header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/test')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Repoheader />
    </div>
}
