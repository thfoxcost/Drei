import ProfileHeader from '#/components/settings/profile'
import VerticalTabsSettings from '#/components/settings/tabs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='mx-20 py-5'>
    <ProfileHeader />
    <VerticalTabsSettings />
  </div>
}
