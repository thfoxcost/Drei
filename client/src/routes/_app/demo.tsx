import { createFileRoute } from "@tanstack/react-router"
import { authMiddleware } from "@/lib/middleware"

export const Route = createFileRoute("/_app/demo")({
  component: Demo,
  // server: {
  //   middleware: [authMiddleware],
  // },
})


function Demo() {

  return (
    <div className="m-auto">
    </div>
  )
}