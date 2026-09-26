import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  CirclePlay,
  CircleUserRound,
  Palette,
  Settings,
} from "lucide-react"
import type { ReactNode } from "react"

import ContentProfile from "./content/profile"
import ContentAccount from "./content/account"
import ContentNotifications from "./content/notifications"
import ContentAppearance from "./content/appearance"

const tabClass =
  "w-full justify-start gap-2 text-left data-active:bg-primary/20! data-active:text-primary! data-active:shadow-none! dark:data-active:border-transparent"

interface VerticalTabsSettingsProps {
  header?: ReactNode
}

function VerticalTabsSettings({ header }: VerticalTabsSettingsProps) {
  return (
    <Tabs
      defaultValue="profile"
      orientation="vertical"
      className="flex w-full flex-row"
    >
      <div className="flex flex-col">
        {header}

        <TabsList className="bg-background mt-2 h-auto w-[200px] flex-col items-stretch gap-1 rounded-none p-0">
          <TabsTrigger value="profile" className={tabClass}>
            <Settings className="size-4" />
            Public Profile
          </TabsTrigger>

          <TabsTrigger value="account" className={tabClass}>
            <CircleUserRound className="size-4" />
            Account
          </TabsTrigger>

          <TabsTrigger value="actions" className={tabClass} disabled>
            <CirclePlay className="size-4" />
            Actions
          </TabsTrigger>

          <TabsTrigger value="notifications" className={tabClass}>
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>

          <TabsTrigger value="appearance" className={tabClass}>
            <Palette className="size-4" />
            Appearance
          </TabsTrigger>
        </TabsList>
      </div>

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

        <TabsContent value="appearance">
          <ContentAppearance />
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default VerticalTabsSettings
