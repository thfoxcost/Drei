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
	UsersRound,
} from "lucide-react";
import OrgMainHeader from "#/components/organization/header";
import { useOrganization } from "#/hooks/useOrganizations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/orgs/$org")({
	component: RouteComponent,
});

const tabs = [
	{
		name: "Overview",
		value: "overview",
		icon: BookOpen,
		disabled: false,
	},
	{
		name: "Repositories",
		value: "repositories",
		icon: BookMarked,
		disabled: false,
	},
	{
		name: "People",
		value: "people",
		icon: Users,
		disabled: false,
	},
	{
		name: "Teams",
		value: "teams",
		icon: UsersRound,
		disabled: false,
	},
	{
		name: "Discussions",
		value: "discussions",
		icon: MessageSquare,
		disabled: true,
	},
	{
		name: "Settings",
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
	const { org } = Route.useParams();
	const { pathname } = useLocation();
	const { data: orgData } = useOrganization(org);

	const activeValue =
		tabs.find((tab) => {
			const to = tabRouteTo[tab.value as keyof typeof tabRouteTo];
			return to !== undefined && pathname === to.replace("$org", org);
		})?.value ?? "overview";

	return (
		<div className="w-full">
			<OrgMainHeader OrgName={orgData?.name ?? org} />

			<Tabs value={activeValue} className="gap-4">
				<div className="w-full border-b bg-muted/10 pb-1">
					<TabsList variant="line" className="ml-2 rounded-none p-0">
						{tabs.map((tab) => {
							const Icon = tab.icon;

							const to = tab.disabled
								? undefined
								: tabRouteTo[tab.value as keyof typeof tabRouteTo];

							const trigger = (
								<>
									<Icon className="size-4" />

									<span className="text-sm">{tab.name}</span>
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
