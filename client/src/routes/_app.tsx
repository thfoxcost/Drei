import { Outlet, createFileRoute } from "@tanstack/react-router"
import Header from "#/components/header"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}