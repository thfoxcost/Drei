import { Circle, Settings } from "lucide-react"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { Button } from "#/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Separator } from "#/components/ui/separator"
import { Textarea } from "#/components/ui/textarea"

function PrNew() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  return (
    <div className="flex max-w-auto items-start gap-3 mt-2">
      <Avatar className="shrink-0 size-10">
        <AvatarImage
          src="https://github.com/shadcn.png"
          alt="@shadcn"
        />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>

      <div className="grid flex-1 grid-cols-1 items-start gap-8 md:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pr-title">
              Add a title
              <span className="text-destructive">*</span>
            </Label>

            <Input
              id="pr-title"
              type="text"
              placeholder="Pull request title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-description">
              Add a description
            </Label>

            <Textarea
              id="pr-description"
              placeholder="Type your description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-40 resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline">
              Cancel
            </Button>

            <Button className="bg-green-700 text-white hover:bg-green-800">
              Create pull request
            </Button>
          </div>
        </div>

        <div className="sticky top-4 self-start text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-2 text-muted-foreground"
              >
                <span className="text-xs font-bold">
                  Reviewers
                </span>

                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Select reviewers
                </DropdownMenuLabel>

                <Input placeholder="Filter reviewers" />
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Avatar size="sm">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>

                  <span>shadcn</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Avatar size="sm">
                    <AvatarFallback>TF</AvatarFallback>
                  </Avatar>

                  <span>thefoxcost</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="px-2 text-xs text-muted-foreground">
            No reviewers
          </span>

          <Separator className="my-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-2 text-muted-foreground"
              >
                <span className="text-xs font-bold">
                  Assignees
                </span>

                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Select assignees
                </DropdownMenuLabel>

                <Input placeholder="Filter assignees" />
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Avatar size="sm">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>

                  <span>shadcn</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Avatar size="sm">
                    <AvatarFallback>TF</AvatarFallback>
                  </Avatar>

                  <span>thefoxcost</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="px-2 text-xs text-muted-foreground">
            No one assigned
          </span>

          <Separator className="my-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-2 text-muted-foreground"
              >
                <span className="text-xs font-bold">
                  Labels
                </span>

                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-72 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Select labels
                </DropdownMenuLabel>

                <Input
                  placeholder="Filter labels"
                  className="h-8"
                />
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Circle className="size-3 fill-red-500 text-red-500" />
                  <span>bug</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Circle className="size-3 fill-cyan-500 text-cyan-500" />
                  <span>enhancement</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Circle className="size-3 fill-blue-500 text-blue-500" />
                  <span>documentation</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="px-2 text-xs text-muted-foreground">
            No labels
          </span>
        </div>
      </div>
    </div>
  )
}

export default PrNew