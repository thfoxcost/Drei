import { createFileRoute } from "@tanstack/react-router"
import { authMiddleware } from "@/lib/middleware"
import Main from "#/components/home/main"

export const Route = createFileRoute("/_app/home")({
  component: Home,
  server: {
    middleware: [authMiddleware],
  },
})


function Home() {

  return (
    <div className="m-auto">
      <Main />
    </div>
  )
}