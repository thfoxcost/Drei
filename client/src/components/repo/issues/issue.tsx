import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field } from "#/components/ui/field"
import {
  InputGroup,
  InputGroupInput,
} from "#/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "#/components/ui/avatar"
import {
  ChevronDown,
  CircleCheck,
  CircleDot,
} from "lucide-react"
import { Input } from "#/components/ui/input"
import IssueItem from "./issue-item"

const issue = {
  title: "Fix authentication bug",
  assignedTo: 12,
  number: 42,
  state: "open",
  description: "Users are unable to log in with GitHub.",
  author: 7,
  tags: ["bug", "authentication"],
  createdAt: "2026-08-08T20:00:00Z",
  updatedAt: "2026-08-08T21:30:00Z",
  closedAt: null,
  closedBy: null,
  comments: [
    {
      id: 1,
      body: "I'm looking into this.",
      createdAt: "2026-08-08T20:10:00Z",
      updatedAt: "2026-08-08T20:10:00Z",
      createdBy: 12,
    },
    {
      id: 2,
      body: "Found the issue.",
      createdAt: "2026-08-08T21:00:00Z",
      updatedAt: "2026-08-08T21:15:00Z",
      createdBy: 7,
    },
  ],
}

function Issues() {
  return (
    <div className="mx-40">
      <h1 className="mb-4 text-2xl font-semibold">
        All issues
      </h1>

      <div className="my-2 flex flex-row items-center justify-between">
        <Tabs defaultValue="open" className="w-auto">
          <TabsList>
            <TabsTrigger value="open">
              <CircleDot />
              Open
            </TabsTrigger>

            <TabsTrigger value="close">
              <CircleCheck />
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Field className="mx-3 w-full">
          <InputGroup>
            <InputGroupInput placeholder="Type to search" />
          </InputGroup>
        </Field>

        <div className="flex flex-row items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Author
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-auto">
              <DropdownMenuGroup>
                <Input
                  placeholder="Type to search"
                  className="w-[200px]"
                />
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>

                  <span className="ml-1">
                    thefoxcost
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sort
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-auto">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  Newest
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Oldest
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Most recently updated
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Least recently updated
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Most commented
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Least commented
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Nearest due date
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Farthest due date
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Assigned
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-auto">
              <DropdownMenuGroup>
                <Input
                  placeholder="Type to search"
                  className="w-[200px]"
                />

                <DropdownMenuItem className="mt-2">
                  Assigned to nobody
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Contributors
                </DropdownMenuLabel>

                <DropdownMenuItem>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>

                  <span className="ml-2">
                    thefoxcost
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="bg-green-700 text-white hover:bg-green-800">
            New Issue
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border">
        <IssueItem {...issue} />
        <IssueItem {...issue} />
        <IssueItem {...issue} />
        <IssueItem {...issue} />
      </div>
    </div>
  )
}

export default Issues