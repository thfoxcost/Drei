import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  )
}