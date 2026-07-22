import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    FolderGit2,
    GitPullRequest,
    CircleDot,
    Play,
    Shield,
    BarChart3,
    Settings,
} from 'lucide-react'

const tabs = [
    {
        name: "Files",
        value: "files",
        icon: FolderGit2,
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
        disabled: false,
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
    }
]

const TabsCustomUnderlineDemo = () => {
    return (
        <div className="w-full mt-2">
            <Tabs defaultValue="files" className="gap-4">
                <TabsList
                    variant="line"
                    className="gap-0 rounded-none border-b p-0"
                >
                    {tabs.map(tab => {
                        const Icon = tab.icon

                        return (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                disabled={tab.disabled}
                                className={`not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30 border-0 group-data-horizontal/tabs:after:-bottom-[1px] not-data-active:hover:group-data-horizontal/tabs:after:opacity-100 data-[state=active]:bg-muted rounded-t-md mx-3 ${tab.value === "settings" ? "ml-auto" : ""
                                    }`}
                            >
                                <Icon className="size-4" />
                                {tab.name}
                            </TabsTrigger>

                        )
                    })}
                    <TabsTrigger
                        key="settings"
                        value="settings"
                        disabled
                        className="ml-auto mr-3 gap-2 border-0 not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30 group-data-horizontal/tabs:after:-bottom-[1px] not-data-active:hover:group-data-horizontal/tabs:after:opacity-100 data-[state=active]:bg-muted rounded-t-md ml-202 mr-8"
                    >
                        <Settings className="size-4.5" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {tabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <p className="text-muted-foreground text-sm">
                            {tab.name}
                        </p>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

export default TabsCustomUnderlineDemo