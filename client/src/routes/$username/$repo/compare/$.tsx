import PrNew from "#/components/repo/pulls/pr-new"
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert"
import { createFileRoute } from "@tanstack/react-router"
import { TriangleAlertIcon } from "lucide-react"

export const Route = createFileRoute("/$username/$repo/compare/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat } = Route.useParams()

  if (!_splat) {
    return (
      <Alert className="border-none bg-destructive/10 text-destructive">
        <TriangleAlertIcon />
        <AlertTitle>Invalid comparison</AlertTitle>
        <AlertDescription className="text-destructive/80">
          Please provide a valid base and source branch.
        </AlertDescription>
      </Alert>
    )
  }

  const [base, source] = _splat.split("...")

  if (!base || !source) {
    return (
      <Alert className="border-none bg-destructive/10 text-destructive">
        <TriangleAlertIcon />
        <AlertTitle>Invalid comparison</AlertTitle>
        <AlertDescription className="text-destructive/80">
          Something went wrong. Please try again or use a different
          comparison.
        </AlertDescription>
      </Alert>
    )
  }

  return <PrNew />
}