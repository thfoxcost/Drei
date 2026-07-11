import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "#/components/reui/alert.tsx"
import { CircleAlertIcon } from "lucide-react"

export function Pattern() {
  return (
    <Alert variant="info">
      <CircleAlertIcon
      />
      <AlertTitle>Info! Something important</AlertTitle>
      <AlertDescription>
        This is an important message. Please read it carefully.
      </AlertDescription>
    </Alert>
  )
}