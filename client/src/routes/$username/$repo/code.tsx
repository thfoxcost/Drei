import Code from '#/components/repo/code/code'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/code')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Code />
}
