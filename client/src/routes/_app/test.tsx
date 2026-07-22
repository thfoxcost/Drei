import Repoheader from '#/components/repo-header'
import ReposMainHeader from '#/components/Repos-main-header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/test')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    {/* please add this as the header if that specific route */}
    <ReposMainHeader />
    <Repoheader />
    </div>
}
