import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  CirclePlay,
  CircleUserRound,
  ListChecks,
  Palette,
  Settings,
} from "lucide-react"
import type { ReactNode } from "react"

import ContentProfile from "./content/profile"
import ContentAccount from "./content/account"
import ContentNotifications from "./content/notifications"
import ContentAppearance from "./content/appearance"
import ContentGeneral from "./content/general"
import { useTranslation } from "react-i18next"

const tabClass =
  "w-full justify-start gap-2 text-left data-active:bg-primary/20! data-active:text-primary! data-active:shadow-none! dark:data-active:border-transparent"

interface VerticalTabsSettingsProps {
  header?: ReactNode
}

function VerticalTabsSettings({ header }: VerticalTabsSettingsProps) {
  const { t } = useTranslation()

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
{t("settings.tabs.profile")}
          </TabsTrigger>

          <TabsTrigger value="account" className={tabClass}>
            <CircleUserRound className="size-4" />
{t("settings.tabs.account")}
          </TabsTrigger>

          <TabsTrigger value="general" className={tabClass}>
            <ListChecks className="size-4" />
{t("settings.tabs.general")}
          </TabsTrigger>

          <TabsTrigger value="actions" className={tabClass} disabled>
            <CirclePlay className="size-4" />
            {t("settings.tabs.actions")}
          </TabsTrigger>

          <TabsTrigger value="notifications" className={tabClass}>
            <Bell className="size-4" />
{t("settings.tabs.notifications")}
          </TabsTrigger>

          <TabsTrigger value="appearance" className={tabClass}>
            <Palette className="size-4" />
{t("settings.tabs.appearance")}
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

        <TabsContent value="general">
          <ContentGeneral />
        </TabsContent>

        <TabsContent value="actions">
          <div className="space-y-1">
            <h3 className="font-medium">
              {t("settings.actions.heading")}
            </h3>

            <p className="text-muted-foreground text-sm">
              {t("settings.actions.description")}
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
