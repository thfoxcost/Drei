import { createFileRoute } from "@tanstack/react-router";
import SettingsLoading from "#/components/settings/loading";
import ProfileHeader from "#/components/settings/profile";
import VerticalTabsSettings from "#/components/settings/tabs";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending } = authClient.useSession();

  if (isPending) {
    return <SettingsLoading />;
  }

  return (
    <div className="mx-20 py-5">
      <VerticalTabsSettings header={<ProfileHeader />} />
    </div>
  );
}
