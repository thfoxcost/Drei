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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIssues } from "@/hooks/useIssues";
import { usePullRequests } from "@/hooks/PRs/use-pull-requests";
import { useRepoData } from "@/hooks/useRepoData";
import RepoStarsheader from "./repo-stars-header";

const tabs = [
  { name: "Code", value: "files", icon: Code, disabled: false },
  { name: "Issues", value: "issues", icon: CircleDot, disabled: false },
  {
    name: "Pull Requests",
    value: "pulls",
    icon: GitPullRequest,
    disabled: false,
  },
  { name: "Actions", value: "actions", icon: Play, disabled: false },
  { name: "Security", value: "security", icon: Shield, disabled: false },
  { name: "Insights", value: "insights", icon: BarChart3, disabled: true },
  { name: "Settings", value: "settings", icon: Settings, disabled: false },
];

const tabRouteTo = {
  files: "/$username/$repo",
  issues: "/$username/$repo/issues",
  pulls: "/$username/$repo/pulls",
  settings: "/$username/$repo/settings",
  security: "/$username/$repo/security",
  actions: "/$username/$repo/actions"

} as const;

interface RepoProps {
  owner: string;
  repo: string;
}

export default function RepoTabs({ owner, repo }: RepoProps) {
  const { data: repoData, isPending } = useRepoData(owner, repo);
  const { data: issuesData } = useIssues(owner, repo, { state: "open" });
  const { data: pullsData } = usePullRequests(owner, repo, { state: "open" });

  const [loadingTab, setLoadingTab] = useState<string | null>(null);

  const matches = useRouterState({
    select: (s) => s.matches,
  });

  const repoPrefix = "/$username/$repo";

  const isRepoRoot = matches.some(
    (match) =>
      match.routeId === `${repoPrefix}/` ||
      match.routeId === `${repoPrefix}/branch/$branchName`,
  );

  const currentTab = useMemo(() => {
    const routeIds = matches.map((match) => match.routeId);

    for (const routeId of [...routeIds].reverse()) {
      if (routeId === `${repoPrefix}/tree/$branch`) {
        return "files";
      }

      if (routeId === `${repoPrefix}/branch/$branchName`) {
        return "files";
      }

      if (routeId.startsWith(`${repoPrefix}/issues`)) {
        return "issues";
      }

      if (routeId.startsWith(`${repoPrefix}/pulls`)) {
        return "pulls";
      }

      if (routeId === `${repoPrefix}/settings`) {
        return "settings";
      }

      if (routeId === `${repoPrefix}/`) {
        return "files";
      }
    }

    return "files";
  }, [matches]);

  useEffect(() => {
    if (loadingTab && currentTab === loadingTab) {
      setLoadingTab(null);
    }
  }, [currentTab, loadingTab]);

  const tabTo = (value: string) =>
    tabRouteTo[value as keyof typeof tabRouteTo];

  const triggerClass = (value: string) => `
		mx-2 gap-2 rounded-t-md border-0
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
          owner={owner}
          visibility={repoData?.visibility ?? true}
          link="https://thefoxcost.vercel.app/"
          website={repoData?.website}
          logo={repoData?.logo}
          commits={repoData?.commits ?? []}
          defaultBranch={repoData?.defaultBranch ?? "main"}
          isLoading={isPending}
          description={repoData?.description}
          files={repoData?.files}
          langs={repoData?.langs}
          isFork={repoData?.isFork}
          forkedFromOwner={repoData?.forkedFromOwner}
          forkedFromName={repoData?.forkedFromName}
        />
      )}

      <Tabs value={currentTab} className="gap-4">
        <div className="w-full border-b bg-muted/10 pb-1">
          <TabsList variant="line" className="ml-2 rounded-none p-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isLoadingThisTab = loadingTab === tab.value;
              const to = tab.disabled
                ? undefined
                : tabTo(tab.value);

              const trigger = (
                <>
                  {isLoadingThisTab ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}

                  <span className="text-sm">{tab.name}</span>

                  {tab.value === "issues" &&
                    (issuesData?.open ?? 0) > 0 && (
                      <Badge variant="secondary">
                        {issuesData?.open ?? 0}
                      </Badge>
                    )}

                  {tab.value === "pulls" &&
                    (pullsData?.open ?? 0) > 0 && (
                      <Badge variant="secondary">
                        {pullsData?.open ?? 0}
                      </Badge>
                    )}
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
                      params={{
                        username: owner,
                        repo,
                      }}
                      onClick={() =>
                        setLoadingTab(tab.value)
                      }
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
          <TabsContent
            key={tab.value}
            value={tab.value}
          />
        ))}
      </Tabs>
    </div>
  );
}
