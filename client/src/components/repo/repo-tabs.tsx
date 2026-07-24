import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GitPullRequest,
  CircleDot,
  Play,
  Shield,
  BarChart3,
  Settings,
  Code,
} from "lucide-react"

const tabs = [
  {
    name: "Code",
    value: "files",
    icon: Code,
    disabled: false,
  },
  {
    name: "Pull Requests",
    value: "pulls",
    icon: GitPullRequest,
    disabled: true,
  },
  {
    name: "Issues",
    value: "issues",
    icon: CircleDot,
    disabled: true,
  },
  {
    name: "Actions",
    value: "actions",
    icon: Play,
    disabled: true,
  },
  {
    name: "Security",
    value: "security",
    icon: Shield,
    disabled: true,
  },
  {
    name: "Insights",
    value: "insights",
    icon: BarChart3,
    disabled: true,
  },
  {
    name: "Settings",
    value: "settings",
    icon: Settings,
    disabled: true,
  },
]

export default function RepoTabs() {
  return (
    <div className="w-full">
      <Tabs defaultValue="files" className="gap-4">
        <div className="w-full border-b pb-1 bg-muted/10">          <TabsList
          variant="line"
          className="rounded-none p-0"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={`
                  mx-3 gap-2 rounded-t-md border-0
                  data-[state=active]:bg-muted
                  group-data-horizontal/tabs:after:bottom-[-6px]
                  not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30
                  not-data-active:hover:group-data-horizontal/tabs:after:opacity-100
                  ${tab.value === "settings" ? "ml-auto mr-3" : ""}
                `}
              >
                <Icon className="size-4" />
                <span className="text-sm">{tab.name}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}