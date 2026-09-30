import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import {
	BookMarked,
	BookOpen,
	MessageSquare,
	Settings,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import OrgMainHeader from "#/components/organization/header";
import { useOrganization } from "#/hooks/useOrganizations";
import { authClient } from "#/lib/auth-client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/orgs/$org")({
	component: RouteComponent,
});

const tabs = [
	{
		key: "overview",
		value: "overview",
		icon: BookOpen,
		disabled: false,
	},
	{
		key: "repositories",
		value: "repositories",
		icon: BookMarked,
		disabled: false,
	},
	{
		key: "people",
		value: "people",
		icon: Users,
		disabled: false,
	},
	{
		key: "discussions",
		value: "discussions",
		icon: MessageSquare,
		disabled: true,
	},
	{
		key: "settings",
		value: "settings",
		icon: Settings,
		disabled: false,
	},
];

const tabRouteTo = {
	overview: "/orgs/$org",
	repositories: "/orgs/$org/repositories",
	people: "/orgs/$org/people",
	teams: "/orgs/$org/teams",
	settings: "/orgs/$org/settings",
} as const;

function RouteComponent() {
	const { t } = useTranslation();
	const { org } = Route.useParams();
	const { pathname } = useLocation();
	const { data: orgData } = useOrganization(org);
	const { data: session } = authClient.useSession();

	// The Settings tab is only shown to the organization creator.
	const isOwner =
		!!session?.user?.id &&
		!!orgData &&
		session.user.id === orgData.createdBy.id;
	const visibleTabs = tabs.filter((tab) => tab.value !== "settings" || isOwner);

	const activeValue =
		visibleTabs.find((tab) => {
			const to = tabRouteTo[tab.value as keyof typeof tabRouteTo];
			return to !== undefined && pathname === to.replace("$org", org);
		})?.value ?? "overview";

	return (
		<div className="w-full">
			<OrgMainHeader OrgName={orgData?.name ?? org} />

			<Tabs value={activeValue} className="gap-4">
				<div className="w-full border-b bg-muted/10 pb-1">
					<TabsList variant="line" className="ml-2 rounded-none p-0">
						{visibleTabs.map((tab) => {
							const Icon = tab.icon;

							const to = tab.disabled
								? undefined
								: tabRouteTo[tab.value as keyof typeof tabRouteTo];

							const trigger = (
								<>
									<Icon className="size-4" />

									<span className="text-sm">{t(`orgs.tabs.${tab.key}`)}</span>
								</>
							);

							if (to) {
								return (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										asChild
										className={`
											mx-2 gap-2 rounded-t-md border-0
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
										<Link to={to} params={{ org }}>
											{trigger}
										</Link>
									</TabsTrigger>
								);
							}

							return (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									disabled={tab.disabled}
									className={`
										mx-2 gap-2 rounded-t-md border-0
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
									{trigger}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>
			</Tabs>

			<Outlet />
		</div>
	);
}
