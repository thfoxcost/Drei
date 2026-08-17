import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/$username/$repo/tree/$branch")({
  component: RouteLayout,
})

function RouteLayout() {
  return <Outlet />
}
