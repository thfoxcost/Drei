import { Badge as ReuiBadge } from "@/components/reui/badge";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  CircleCheck,
  Copy,
  FileDiff,
  GitCommit,
  GitPullRequest,
  ListChecks,
  MessageSquare,
  Pen,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Commits from "./content/commits";

function PRdetail({ pull }: { pull: string }) {
  // swap these for real data whenever you wire it up
  const stats = {
    conversation: 3,
    commits: 3,
    checks: 1,
    filesChanged: 16,
    additions: 1307,
    deletions: 171,
  };

  const maxSquares = 5;

  const greenSquares = Math.min(stats.additions, maxSquares);

  const redSquares = Math.min(
    stats.deletions,
    maxSquares - greenSquares,
  );

  const emptySquares = maxSquares - greenSquares - redSquares;

  return (
    <div>
      <h1 className="flex min-w-0 items-baseline gap-1 truncate text-3xl font-medium tracking-tight">
        <span className="min-w-0 truncate">
          feat: implement pull requests feature with UI components
        </span>

        <span className="shrink-0 font-light text-muted-foreground">
          #{pull}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button variant="outline">
            <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.293-1.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" fill="currentColor"/></g></svg>
            Able to merge
          </Button>
		  

          <Button variant="outline">
            <Pen />
          </Button>
        </div>
      </h1>

      <div className="mt-2 flex items-center gap-2">
        <Badge
          variant="secondary"
          className="h-7 gap-1.5 bg-green-600 text-sm"
        >
          <GitPullRequest className="size-4 shrink-0" />
          <span className="font-bold">Open</span>
        </Badge>

        <span className="text-sm text-muted-foreground">
          <span className="font-semibold underline">thefoxcost</span>{" "}
          wants to merge 2 commits into{" "}
          <ReuiBadge variant="save-info">main</ReuiBadge> from{" "}
          <ReuiBadge variant="save-info">feat/pulls</ReuiBadge>
        </span>

        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Copy />
        </Button>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="conversation" className="gap-4">
          <div className="flex items-center justify-between border-b">
            <TabsList className="justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="conversation"
                className="
                  data-active:border-b-background!
                  data-active:border-border
                  bg-transparent!
                  shadow-none!
                  data-active:-mb-0.75
                  data-active:rounded-b-none
                  data-active:border-b-2
                  gap-1.5
                "
              >
                <MessageSquare className="size-4" />
                Conversation
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs font-medium"
                >
                  {stats.conversation}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="commits"
                className="
                  data-active:border-b-background!
                  data-active:border-border
                  bg-transparent!
                  shadow-none!
                  data-active:-mb-0.75
                  data-active:rounded-b-none
                  data-active:border-b-2
                  gap-1.5
                "
              >
                <GitCommit className="size-4" />
                Commits
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs font-medium"
                >
                  {stats.commits}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="checks"
                className="
                  data-active:border-b-background!
                  data-active:border-border
                  bg-transparent!
                  shadow-none!
                  data-active:-mb-0.75
                  data-active:rounded-b-none
                  data-active:border-b-2
                  gap-1.5
                "
              >
                <ListChecks className="size-4" />
                Checks
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs font-medium"
                >
                  {stats.checks}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="changes"
                className="
                  data-active:border-b-background!
                  data-active:border-border
                  bg-transparent!
                  shadow-none!
                  data-active:-mb-0.75
                  data-active:rounded-b-none
                  data-active:border-b-2
                  gap-1.5
                "
              >
                <FileDiff className="size-4" />
                Files changed
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs font-medium"
                >
                  {stats.filesChanged}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1.5 pb-2 text-xs">
              {stats.additions > 0 && (
                <span className="text-green-600 dark:text-green-500">
                  +{stats.additions}
                </span>
              )}

              {stats.deletions > 0 && (
                <span className="text-red-600 dark:text-red-500">
                  -{stats.deletions}
                </span>
              )}

              <div className="flex items-center gap-0.5">
                {Array.from({ length: greenSquares }).map((_, index) => (
                  <span
                    key={`green-${index}`}
                    className="h-2.5 w-2.5 bg-green-500"
                  />
                ))}

                {Array.from({ length: redSquares }).map((_, index) => (
                  <span key={`red-${index}`} className="h-2.5 w-2.5 bg-red-500" />
                ))}

                {Array.from({ length: emptySquares }).map((_, index) => (
                  <span
                    key={`empty-${index}`}
                    className="h-2.5 w-2.5 bg-muted"
                  />
                ))}
              </div>
            </div>
          </div>

          <TabsContent value="conversation">
            <p className="text-sm text-muted-foreground">
              PR conversation goes here.
            </p>
          </TabsContent>

          <TabsContent value="commits">
            <Commits />
          </TabsContent>

          <TabsContent value="checks">
            <p className="text-sm text-muted-foreground">
              Checks for this pull request go here.
            </p>
          </TabsContent>

          <TabsContent value="changes">
            <p className="text-sm text-muted-foreground">
              Changes for this pull request go here.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PRdetail;