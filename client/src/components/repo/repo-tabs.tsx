import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	CircleDot,
	Code,
	GitPullRequest,
	Loader2,
	Play,
	Settings,
	Shield,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRepoData } from "@/hooks/useRepoData";
import RepoStarsheader from "./repo-stars-header";

const tabs = [
	{ name: "Code", value: "files", icon: Code, disabled: false },
	{ name: "Issues", value: "issues", icon: CircleDot, disabled: false },

	{
		name: "Pull Requests",
		value: "pulls",
		icon: GitPullRequest,
		disabled: true,
	},
	{ name: "Actions", value: "actions", icon: Play, disabled: true },
	{ name: "Security", value: "security", icon: Shield, disabled: true },
	{ name: "Insights", value: "insights", icon: BarChart3, disabled: true },
	{ name: "Settings", value: "settings", icon: Settings, disabled: false },
];

// Route each tab navigates to. Pull Requests maps to the existing /prs route.
const tabRouteTo = {
	files: "/$username/$repo",
	issues: "/$username/$repo/issues",
	pulls: "/$username/$repo/prs",
	settings: "/$username/$repo/settings",
} as const;

interface RepoProps {
	owner: string;
	repo: string;
}

export default function RepoTabs({ owner, repo }: RepoProps) {
	const { data: repoData } = useRepoData(owner, repo);
	const [loadingTab, setLoadingTab] = useState<string | null>(null);

	// Derive the active tab from the matched routes so nested pages such as
	// /issues/new still highlight their parent tab.
	const matches = useRouterState({ select: (s) => s.matches });
	const repoPrefix = "/$username/$repo";

	// The stars header stays in its original spot in the layout but only
	// renders on the repository root, not on nested routes like /issues.
	const isRepoRoot = matches.some(
		(match) => match.routeId === `${repoPrefix}/`,
	);

	const currentTab = useMemo(() => {
		const routeIds = matches.map((match) => match.routeId);

		// Deepest matched route wins.
		for (const routeId of [...routeIds].reverse()) {
			if (routeId === `${repoPrefix}/tree/$branch`) return "files";
			if (routeId.startsWith(`${repoPrefix}/issues`)) return "issues";
			if (routeId === `${repoPrefix}/settings`) return "settings";
			if (routeId === `${repoPrefix}/prs`) return "pulls";
			if (routeId === `${repoPrefix}/`) return "files";
		}

		return "files";
	}, [matches]);

	// Clear the loading indicator once navigation lands on the clicked tab.
	useEffect(() => {
		if (loadingTab && currentTab === loadingTab) {
			setLoadingTab(null);
		}
	}, [currentTab, loadingTab]);

	const tabTo = (value: string) => tabRouteTo[value as keyof typeof tabRouteTo];

	const triggerClass = (value: string) => `
    mx-3 gap-2 rounded-t-md border-0
    hover:cursor-pointer
    hover:bg-secondary
    active:bg-secondary
    data-[state=active]:bg-muted
    group-data-horizontal/tabs:after:bottom-[-6px]
    not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30
    not-data-active:hover:group-data-horizontal/tabs:after:opacity-100
    ${value === "settings" ? "ml-auto mr-3" : ""}
  `;

	return (
		<div className="w-full">
			{isRepoRoot && (
				<RepoStarsheader
					reponame={repo}
					visibility={repoData?.visibility ?? true}
					link="https://thefoxcost.vercel.app/"
					website={repoData?.website}
					logo={repoData?.logo}
				/>
			)}
			<Tabs value={currentTab} className="gap-4 ">
				<div className="w-full border-b pb-1 bg-muted/10">
					<TabsList variant="line" className="rounded-none p-0">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							const isLoadingThisTab = loadingTab === tab.value;
							const to = tab.disabled ? undefined : tabTo(tab.value);
							const trigger = (
								<>
									{isLoadingThisTab ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Icon className="size-4" />
									)}
									<span className="text-sm">{tab.name}</span>
								</>
							);

							if (to) {
								return (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										asChild
										className={triggerClass(tab.value)}
									>
										<Link
											to={to}
											params={{ username: owner, repo }}
											onClick={() => setLoadingTab(tab.value)}
										>
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
									className={triggerClass(tab.value)}
								>
									{trigger}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>

				{tabs.map((tab) => (
					<TabsContent key={tab.value} value={tab.value}></TabsContent>
				))}
			</Tabs>
		</div>
	);
}
