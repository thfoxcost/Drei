import { createFileRoute } from "@tanstack/react-router"
import Code from "#/components/repo/code/code"

export const Route = createFileRoute("/$username/$repo/blob/$branch/$")({
  component: RouteComponent,
})

function RouteComponent() {
  return <Code />
}
