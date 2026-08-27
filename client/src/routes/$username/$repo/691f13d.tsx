import Commit from '#/components/repo/commits/commit'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/691f13d')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='px-7 py-2'>
    <Commit />
  </div>
}
