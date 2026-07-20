import { Spinner } from "#/components/ui/spinner"

import { useNavigate } from "@tanstack/react-router"
import {
  Globe,
  Lock,
  Check,
  ChevronDown,
} from "lucide-react"
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
  DropdownMenuItem,
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
import { Card, CardContent } from "#/components/ui/card"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/new")({
  component: New,
  server: {
    middleware: [authMiddleware],
  },
})






function New() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  // states to get the data
  const { data: session } = authClient.useSession()
  const [visibility, setVisibility] = useState("Public")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  async function createRepository() {
    setLoading(true)
    if (name == "" || description == "" || visibility == "") {
      toast.error("Please fill all the fields")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("http://localhost:3200/api/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: session?.user.id,
          userEmail: session?.user.email,
          username: session?.user.name,
          reponame: name,
          description,
          visibility: visibility === "Public",
        })
      })

      if (!res.ok) {
        throw new Error("Failed to create repository")
      }

      const data = await res.json()

      navigate({ to: `/repo/${name}` }) // redirect to the repo page
      console.log(data)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }




  const visibilityOptions = [
    {
      value: "Public",
      icon: Globe,
      description:
        "Anyone on the internet can see this repository. You choose who can commit.",
    },
    {
      value: "Private",
      icon: Lock,
      description:
        "You choose who can see and commit to this repository.",
    },
  ] as const

  const selectedVisibility =
    visibilityOptions.find((v) => v.value === visibility) ??
    visibilityOptions[0]

  const SelectedIcon = selectedVisibility.icon

  const initials =
    session?.user.name
      ?.split(" ")
      .map((word) => word[0]!)
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "??"

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">
          Create a new repository
        </h1>

        <p className="text-muted-foreground">
          A repository contains all of your project's files and revision history.
        </p>
      </header>

      <form
        className="space-y-8"
        onSubmit={async (e) => {
          e.preventDefault()
          await createRepository()
        }}
      >
        <section className="space-y-4">
          <p className="text-md mb-0 font-bold">General</p>
          <div className="flex flex-wrap items-end gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 py-4">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={
                        session?.user.image ??
                        import.meta.env.VITE_DEFAULT_AVATAR_URL
                      }
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <span>{session?.user.name ?? "Unknown User"}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-auto">
                <p className="p-2 text-sm text-muted-foreground">
                  Organization selector coming soon.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>


            <Field className="flex-1">
              <FieldLabel htmlFor="repo-name">
                Repository name *
              </FieldLabel>
              <Input
                id="repo-name"
                name="name"
                placeholder="awesome-project"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </div>

          <p className="text-sm text-muted-foreground">
            Great repository names are short and memorable. Need inspiration?{" "}
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
              name="description"
              rows={3}
              maxLength={350}
              placeholder="Tell people what your repository is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <FieldDescription>
              Briefly describe your repository (optional, max 350 characters).
            </FieldDescription>
          </Field>
        </section>
      </form>

      <p className="text-md mb-0 font-bold">Configuration</p>
      <Card size="sm" className="my-5">
        <CardContent>
          <div className="flex flex-row justify-between items-center">
            <div className="">
              <p className="text-md font-bold">
                Choose visibility
              </p>
              <span className="text-muted-foreground">Choose who can see and commit to this repository</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SelectedIcon className="size-4
      text-muted-foreground" />
                  <span>{selectedVisibility.value}</span>
                  <ChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-80 p-1">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon
                  const active = visibility === option.value

                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                    >
                      <Icon className="mt-0.5 size-4 text-muted-foreground shrink-0" />

                      <div className="flex-1">
                        <div className="font-medium">{option.value}</div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>

                      {active && <Check className="size-4 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <a href="/home">
          <Button variant="outline">Cancel</Button>
        </a>
        <Button
          onClick={createRepository}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner />
              <span className="ml-2">Creating...</span>
            </>
          ) : (
            "Create repository"
          )}
        </Button>
      </div>
    </main>
  )
}