import Commit from '#/components/repo/commits/commit'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/691f13d')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className=''>
    <Commit />
  </div>
}
