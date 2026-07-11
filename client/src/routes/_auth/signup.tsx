import { SignUpPage } from '#/components/authup'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignUpPage />
}
