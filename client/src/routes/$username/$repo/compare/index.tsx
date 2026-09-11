import { Alert, AlertAction, AlertTitle } from '#/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { InfoIcon } from 'lucide-react'

export const Route = createFileRoute('/$username/$repo/compare/')({
  component: NewPRalert,
})

export function NewPRalert() {
  return (
    <Alert className="border-blue-500/50 bg-blue-500/10 py-3 text-blue-500">
      <InfoIcon />
      <AlertTitle>
        Discuss and review the changes in this comparison with others.
      </AlertTitle>

      <AlertAction>
        <Button className="bg-green-600 text-white hover:bg-green-700">
          Create pull request
        </Button>
      </AlertAction>
    </Alert>
  )
}

