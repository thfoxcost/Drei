import SettingTabs from '#/components/repo/settings/nav'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/$repo/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <SettingTabs />
    <Outlet />
  </div>
}
