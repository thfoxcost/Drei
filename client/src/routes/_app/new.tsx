import { createFileRoute } from "@tanstack/react-router"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "#/components/ui/avatar"

import { Button } from "#/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "#/components/ui/field"

import { Input } from "#/components/ui/input"
import { Textarea } from "#/components/ui/textarea"

import { authClient } from "#/lib/auth-client"
import { authMiddleware } from "#/lib/middleware"

export const Route = createFileRoute("/_app/new")({
  server: {
    middleware: [authMiddleware],
  },
  component: New,
})

function New() {
  const { data: session } = authClient.useSession()

  const initials =
    session?.user.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "??"

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <header className="space-y-2">
        <h3 className="text-2xl font-bold">
          Create a new repository
        </h3>

        <p className="text-muted-foreground">
          A repository contains all of your project's files and revision
          history.
        </p>
      </header>

      <form className="space-y-8">
        <section className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <Avatar className="size-6">
                    <AvatarImage
                      src={
                        session?.user.image ??
                        import.meta.env.VITE_DEFAULT_AVATAR_URL
                      }
                    />

                    <AvatarFallback>
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <span>{session?.user.name}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64">
                <p className="p-2 text-sm text-muted-foreground">
                  Organization selector coming soon.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="pb-2 text-xl text-muted-foreground">
              /
            </span>

            <Field className="flex-1">
              <FieldLabel htmlFor="repo-name">
                Repository name *
              </FieldLabel>

              <Input
                id="repo-name"
                placeholder="awesome-project"
              />
            </Field>
          </div>

          <p className="text-sm text-muted-foreground">
            Great repository names are short and memorable.
            Need inspiration?{" "}
            <a
              href="https://www.behindthename.com/random/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Generate a random name
            </a>.
          </p>

          <Field>
            <FieldLabel htmlFor="description">
              Description
            </FieldLabel>

            <Textarea
              id="description"
              maxLength={350}
              rows={3}
              placeholder="Tell people what your repository is about..."
            />

            <FieldDescription>
              Briefly describe your repository (optional,
              max 350 characters).
            </FieldDescription>
          </Field>
        </section>
      </form>
    </main>
  )
}