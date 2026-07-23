import { NoRepo } from '#/components/repo/norepo'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="flex items-center justify-center m-50"> <NoRepo /> </div>
}
