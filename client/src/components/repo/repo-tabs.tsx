import { useState } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GitPullRequest,
  CircleDot,
  Play,
  Shield,
  BarChart3,
  Settings,
  Code,
  Loader2,
} from "lucide-react"
import RepoStarsheader from "./repo-stars-header"
import { useRepoData } from "@/hooks/useRepoData"

const tabs = [
  { name: "Code", value: "files", icon: Code, disabled: false },
  { name: "Pull Requests", value: "pulls", icon: GitPullRequest, disabled: true },
  { name: "Issues", value: "issues", icon: CircleDot, disabled: true },
  { name: "Actions", value: "actions", icon: Play, disabled: true },
  { name: "Security", value: "security", icon: Shield, disabled: true },
  { name: "Insights", value: "insights", icon: BarChart3, disabled: true },
  { name: "Settings", value: "settings", icon: Settings, disabled: false },
]

interface RepoProps {
  owner: string
  repo: string
}

export default function RepoTabs({ owner, repo }: RepoProps) {
  const { data: repoData } = useRepoData(owner, repo)
  const navigate = useNavigate()
  const [loadingTab, setLoadingTab] = useState<string | null>(null)

  // grab current path, e.g. /thefoxcost/test1/settings
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // figure out which tab that corresponds to
  const segments = pathname.split("/").filter(Boolean) // ["thefoxcost", "test1", "settings"]
  const currentTab = segments[2] || "files" // no 3rd segment = repo root = Code tab

  const handleTabClick = async (value: string) => {
    if (value === currentTab) return // already here, skip
    setLoadingTab(value)
    try {
      if (value === "files") {
        await navigate({ to: `/thefoxcost/${repo}` })
      } else {
        await navigate({ to: `/thefoxcost/${repo}/${value}` })
      }
    } finally {
      setLoadingTab(null)
    }
  }

  return (
    <div className="w-full">
      <RepoStarsheader
        reponame={repo}
        visibility={repoData?.visibility || true}
        link="https://thefoxcost.vercel.app/"
      />
      <Tabs value={currentTab} className="gap-4">
        <div className="w-full border-b pb-1 bg-muted/10">
          <TabsList variant="line" className="rounded-none p-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isLoadingThisTab = loadingTab === tab.value

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                  onClick={() => handleTabClick(tab.value)}
                  className={`
                    mx-3 gap-2 rounded-t-md border-0
                    hover:cursor-pointer
                    hover:bg-secondary
                    active:bg-secondary
                    data-[state=active]:bg-muted
                    group-data-horizontal/tabs:after:bottom-[-6px]
                    not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30
                    not-data-active:hover:group-data-horizontal/tabs:after:opacity-100
                    ${tab.value === "settings" ? "ml-auto mr-3" : ""}
                  `}
                >
                  {isLoadingThisTab ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                  <span className="text-sm">{tab.name}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}></TabsContent>
        ))}
      </Tabs>
    </div>
  )
}