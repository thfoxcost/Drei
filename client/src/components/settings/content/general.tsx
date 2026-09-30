import { useEffect, useState } from "react"
import { ListChecks } from "lucide-react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "#/components/ui/field"
import { Kbd } from "#/components/ui/kbd"
import { Separator } from "#/components/ui/separator"
import { Spinner } from "#/components/ui/spinner"
import { Switch } from "#/components/ui/switch"
import {
  useAppearanceSettings,
  useUpdateAppearance,
} from "#/hooks/useAppearanceSettings"

function ContentGeneral() {
  const { data, isLoading } = useAppearanceSettings()
  const updateAppearance = useUpdateAppearance()

  const [todosEnabled, setTodosEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!data || loaded) return

    setTodosEnabled(data.todosEnabled !== false)
    setLoaded(true)
  }, [data, loaded])

  async function handleTodosToggle(enabled: boolean) {
    const previous = todosEnabled

    setTodosEnabled(enabled)

    try {
      await updateAppearance.mutateAsync({ todosEnabled: enabled })
      toast.success(enabled ? "To-do list enabled" : "To-do list disabled")
    } catch (err) {
      setTodosEnabled(previous)
      toast.error(
        err instanceof Error ? err.message : "Failed to save setting",
      )
    }
  }

  if (isLoading || !loaded) {
    return (
      <div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
        <div>
          <h1 className="text-2xl">General</h1>

          <Separator className="my-2" />
        </div>

        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Spinner />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto mb-10 w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl">General</h1>

        <Separator className="my-2" />
      </div>

      <div className="space-y-8">
        <Field>
          <div className="flex items-center justify-between gap-4">
            <div>
              <FieldLabel htmlFor="todos-enabled">
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="size-4" />
                  To-do list
                </span>
              </FieldLabel>

              <FieldDescription>
                Show the built-in to-do list in the header. Disabling it also
                turns off the <Kbd className="px-1">Shift</Kbd>+
                <Kbd className="px-1">R</Kbd> shortcut and every reminder.
              </FieldDescription>
            </div>

            <Switch
              id="todos-enabled"
              checked={todosEnabled}
              disabled={updateAppearance.isPending}
              onCheckedChange={handleTodosToggle}
            />
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline">
            <a href="/">Back</a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ContentGeneral
