import { useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "#/components/ui/input-group"
import { Badge } from "#/components/ui/badge"
import { TreeView, type TreeDataItem } from "#/components/tree-view"
import {
  Check,
  ChevronDown,
  File,
  Folder,
  GitBranch,
  PanelRightOpen,
  Plus,
  SearchIcon,
} from "lucide-react"

function Filetree() {
  const branches = ["main", "develop", "feature/ui", "fix/header"]
  const defaultBranch = "main"

  const navigate = useNavigate()
  const { username, repo, branch: currentBranchParam } = useParams({ strict: false })
  const owner = username as string
  const repoName = repo as string

  const [currentBranch, setCurrentBranch] = useState("main")
  const [branchFilter, setBranchFilter] = useState("")

  const filteredBranches = branches.filter((branch) =>
    branch.toLowerCase().includes(branchFilter.toLowerCase()),
  )

  const handleBranchClick = (branch: string) => {
    setCurrentBranch(branch)
    setBranchFilter("")

    const currentUrl = window.location.pathname
    const branchSegment = currentBranchParam as string
    const branchPrefix = `/tree/${branchSegment}`
    const blobPrefix = `/blob/${branchSegment}`

    let restOfPath = ""
    if (currentUrl.includes(branchPrefix)) {
      restOfPath = currentUrl.split(branchPrefix)[1] || ""
    } else if (currentUrl.includes(blobPrefix)) {
      restOfPath = currentUrl.split(blobPrefix)[1] || ""
    }

    const prefix = currentUrl.includes(branchPrefix) ? "tree" : "blob"

    if (restOfPath && restOfPath !== "/") {
      navigate({
        to: `/$username/$repo/${prefix}/$branch/${restOfPath.replace(/^\//, "")}` as any,
        params: { username: owner, repo: repoName, branch },
      })
    } else {
      navigate({
        to: "/$username/$repo",
        params: { username: owner, repo: repoName },
      })
    }
  }

  const makeTreeItems = (items: TreeDataItem[], parentPath: string): TreeDataItem[] => {
    return items.map((item) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name
      const hasChildren = !!item.children

      return {
        ...item,
        id: fullPath,
        ...(hasChildren ? {
          onClick: () => navigate({
            to: "/$username/$repo/tree/$branch/$" as any,
            params: { username: owner, repo: repoName, branch: currentBranch, _splat: fullPath },
          }),
          children: makeTreeItems(item.children ?? [], fullPath),
        } : {
          onClick: () => navigate({
            to: "/$username/$repo/blob/$branch/$" as any,
            params: { username: owner, repo: repoName, branch: currentBranch, _splat: fullPath },
          }),
        }),
      }
    })
  }

  const fileTree: TreeDataItem[] = makeTreeItems([
    {
      id: "src",
      name: "src",
      icon: Folder,
      children: [
        {
          id: "components",
          name: "components",
          icon: Folder,
          children: [
            {
              id: "button",
              name: "button.tsx",
              icon: File,
            },
            {
              id: "header",
              name: "header.tsx",
              icon: File,
            },
          ],
        },
        {
          id: "routes",
          name: "routes",
          icon: Folder,
          children: [
            {
              id: "home",
              name: "home.tsx",
              icon: File,
            },
            {
              id: "settings",
              name: "settings.tsx",
              icon: File,
            },
          ],
        },
        {
          id: "app",
          name: "App.tsx",
          icon: File,
        },
        {
          id: "main",
          name: "main.tsx",
          icon: File,
        },
      ],
    },
    {
      id: "public",
      name: "public",
      icon: Folder,
      children: [
        {
          id: "favicon",
          name: "favicon.ico",
          icon: File,
        },
        {
          id: "logo",
          name: "logo.svg",
          icon: File,
        },
      ],
    },
    {
      id: "package",
      name: "package.json",
      icon: File,
    },
    {
      id: "readme",
      name: "README.md",
      icon: File,
    },
    {
      id: "gitignore",
      name: ".gitignore",
      icon: File,
    },
  ], "")

  return (
    <div className="flex h-screen w-xs flex-col border-r px-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <PanelRightOpen />
          </Button>

          <span className="font-semibold">Files</span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start"
              >
                <GitBranch className="h-4 w-4" />
                {currentBranch}
                <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Switch branch</DropdownMenuLabel>

              <div className="px-2 pb-2">
                <InputGroup>
                  <InputGroupAddon>
                    <SearchIcon className="h-3.5 w-3.5" />
                  </InputGroupAddon>

                  <InputGroupInput
                    placeholder="Find a branch..."
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="text-xs"
                  />
                </InputGroup>
              </div>

              <DropdownMenuSeparator />

              {filteredBranches.length === 0 ? (
                <p className="p-2 text-xs text-muted-foreground">
                  No branches found
                </p>
              ) : (
                filteredBranches.map((branch) => (
                  <DropdownMenuItem
                    key={branch}
                    onClick={() => handleBranchClick(branch)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                      {branch}
                    </span>

                    {branch === defaultBranch ? (
                      <Badge
                        variant="outline"
                        className="h-4 px-1.5 text-[10px]"
                      >
                        Default
                      </Badge>
                    ) : branch === currentBranch ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : null}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" disabled>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Go to file" />
        </InputGroup>

        <div className="pt-1">
          <TreeView data={fileTree} expandAll />
        </div>
      </div>
    </div>
  )
}

export default Filetree