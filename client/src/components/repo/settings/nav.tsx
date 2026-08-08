import { Separator } from '#/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  CirclePlay,
  GitBranch,
  Settings,
  Tags,
  UsersRound,
  Webhook,
} from 'lucide-react'
import General from './general'

const DiscordIcon = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className="size-4"
  >
    <title>Discord</title>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
)

const tabs = [
  {
    name: 'Branches',
    value: 'branches',
    icon: GitBranch,
    content:
      'Manage your repository branches and configure branch-related settings.',
  },
  {
    name: 'Tags',
    value: 'tags',
    icon: Tags,
    content:
      'Manage repository tags and organize your releases and versions.',
  },
  {
    name: 'Actions',
    value: 'actions',
    icon: CirclePlay,
    content:
      'Configure automated workflows and actions for your repository.',
  },
  {
    name: 'Webhooks',
    value: 'webhooks',
    icon: Webhook,
    content:
      'Manage webhooks and configure integrations with external services.',
  },
]

const TabsVerticalLinedDemo = () => {
  return (
    <Tabs
      defaultValue="general"
      orientation="vertical"
      className="flex w-full flex-row mx-60 mt-2"
    >
      <TabsList className="bg-background h-full w-[200px] flex-col items-stretch rounded-none p-0">
        {/* General */}
        <TabsTrigger
          value="general"
          className="w-full justify-start gap-2 text-left data-active:bg-primary/20! data-active:text-primary! data-active:shadow-none! dark:data-active:border-transparent mb-1"
        >
          <Settings />
          General
        </TabsTrigger>

        <Separator className="my-1" />

        {/* Access */}
        <p className="text-muted-foreground px-1 py-2 text-xs font-medium tracking-wider">
          Access
        </p>

        <TabsTrigger
          value="collaborators"
          className="w-full justify-start gap-2 text-left"
        >
          <UsersRound />
          Collaborators
        </TabsTrigger>

        <Separator className="my-2" />

        {/* Code Management */}
        <p className="text-muted-foreground px-1 py-2 text-xs font-medium tracking-wider">
          Code Management
        </p>

        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled
              className="w-full justify-start gap-2 text-left"
            >
              <Icon />
              {tab.name}
            </TabsTrigger>
          )
        })}

        <Separator className="my-2" />

        {/* Integration */}
        <p className="text-muted-foreground px-1 py-2 text-xs font-medium tracking-wider">
          Integration
        </p>

        <TabsTrigger
          value="discord-notifications"
          disabled
          className="w-full justify-start gap-2 text-left"
        >
          <DiscordIcon />
          Discord Notifications
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 px-6">
        {/* General */}
        <TabsContent value="general">
          <General />
        </TabsContent>

        {/* Collaborators */}
        <TabsContent value="collaborators">
        </TabsContent>

        {/* Code Management */}
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="space-y-1">
              <h3 className="font-medium">{tab.name}</h3>
              <p className="text-muted-foreground text-sm">
                {tab.content}
              </p>
            </div>
          </TabsContent>
        ))}

        {/* Discord Notifications */}
        <TabsContent value="discord-notifications">
          <div className="space-y-1">
            <h3 className="font-medium">Discord Notifications</h3>
            <p className="text-muted-foreground text-sm">
              Configure Discord notifications for repository activity and
              events.
            </p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default TabsVerticalLinedDemo