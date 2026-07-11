import { SignInPage } from "#/components/authin"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute('/_auth/signin')({ component: signin })

function signin() {
  return (
      <SignInPage />
  )
}

export default signin