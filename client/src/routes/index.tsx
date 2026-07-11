import { Pattern } from '#/components/mode-toggle'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row m-auto">
      <Pattern />
    </div>
  )
}
