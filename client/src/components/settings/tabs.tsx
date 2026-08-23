import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Bell,
    CirclePlay,
    CircleUserRound,
    Settings,
} from "lucide-react"

import ContentProfile from "./content/profile"
import ContentAccount from "./content/account"
import ContentNotifications from "./content/notifications"

const tabClass =
    "w-full justify-start gap-2 text-left data-active:bg-primary/20! data-active:text-primary! data-active:shadow-none! dark:data-active:border-transparent"

function VerticalTabsSettings() {
    return (
        <Tabs
            defaultValue="profile"
            orientation="vertical"
            className="mt-2 flex w-full flex-row"
        >
            <TabsList className="bg-background h-full w-[200px] flex-col items-stretch gap-1 rounded-none p-0">
                <TabsTrigger value="profile" className={tabClass}>
                    <Settings className="size-4" />
                    Public Profile
                </TabsTrigger>

                <TabsTrigger value="account" className={tabClass}>
                        <CircleUserRound className="size-4"/>
                    Account
                </TabsTrigger>

                <TabsTrigger value="actions" className={tabClass}>
                    <CirclePlay className="size-4" />
                    Actions
                </TabsTrigger>

                <TabsTrigger value="notifications" className={tabClass}>
                    <Bell className="size-4" />
                    Notifications
                </TabsTrigger>
            </TabsList>

            <div className="flex-1 px-6">
                <TabsContent value="profile">
                    <ContentProfile />
                </TabsContent>

                <TabsContent value="account">
                    <ContentAccount />
                </TabsContent>

                <TabsContent value="actions">
                    <div className="space-y-1">
                        <h3 className="font-medium">
                            Actions
                        </h3>

                        <p className="text-muted-foreground text-sm">
                            Configure automated workflows and
                            actions for your repository.
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <ContentNotifications />
                </TabsContent>
            </div>
        </Tabs>
    )
}

export default VerticalTabsSettings