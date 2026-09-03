import { Badge as ReuiBadge } from "@/components/reui/badge";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
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
import { CommitItemMSG, ConversationSheet } from "./content/conversation";
import CommentItem from "./content/conversation";

function PRdetail({ pull }: { pull: string }) {
  // swap these for real data whenever you wire it up
  const stats = {
    conversation: 8,
    commits: 4,
    checks: 1,
    filesChanged: 16,
    additions: 1307,
    deletions: 171,
  };



const conversation = [
  {
    type: "comment" as const,
    date: "2026-08-27T09:15:00",
    username: "alexdev",
    avatarLink: "https://github.com/shadcn.png",
    comment:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
  },
  {
    type: "commit" as const,
    date: "2026-08-28T10:15:00",
    username: "thefoxcost",
    avatarLink: "https://github.com/shadcn.png",
    message: "feat: add pull request conversation UI",
    hash: "a13f921",
  },
  {
    type: "commit" as const,
    date: "2026-08-28T13:42:00",
    username: "thefoxcost",
    avatarLink: "https://github.com/shadcn.png",
    message: "feat: add pull request tabs and statistics",
    hash: "b72c410",
  },
  {
    type: "commit" as const,
    date: "2026-08-29T09:20:00",
    username: "thefoxcost",
    avatarLink: "https://github.com/shadcn.png",
    message: "feat: add commit messages to pull request timeline",
    hash: "c33e686",
  },
  {
    type: "comment" as const,
    date: "2026-08-29T16:45:00",
    username: "alexdev",
    avatarLink: "https://github.com/shadcn.png",
    comment:
      "The implementation looks good. The conversation timeline is much easier to follow now. I only noticed a few spacing issues.",
  },
  {
    type: "commit" as const,
    date: "2026-08-30T11:05:00",
    username: "thefoxcost",
    avatarLink: "https://github.com/shadcn.png",
    message: "fix: improve pull request conversation spacing",
    hash: "e82b104",
  },
  {
    type: "commit" as const,
    date: "2026-08-30T15:30:00",
    username: "thefoxcost",
    avatarLink: "https://github.com/shadcn.png",
    message: "fix: align pull request action buttons",
    hash: "91f3a27",
  },
  {
    type: "comment" as const,
    date: "2026-08-31T10:20:00",
    username: "mohdev",
    avatarLink: "https://github.com/shadcn.png",
    comment:
      "Reviewed the latest changes. Everything looks clean from my side.",
  },
  {
    type: "commit" as const,
    date: "2026-09-01T08:40:00",
    username: "thefoxcost",
    avatarLink: "https://github.com/shadcn.png",
    message: "feat: add merge status and pull request actions",
    hash: "f41d8ac",
  },
  {
    type: "comment" as const,
    date: "2026-09-01T13:25:00",
    username: "alexdev",
    avatarLink: "https://github.com/shadcn.png",
    comment:
      "Everything looks good now. Approved.",
  },
];

  
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
            <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.293-1.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" fill="currentColor" /></g></svg>
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
                disabled
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
                  <span
                    key={`red-${index}`}
                    className="h-2.5 w-2.5 bg-red-500"
                  />
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
            <div className="flex w-full flex-row gap-4">
              <div className="flex w-full flex-col gap-4">
                <div className="flex flex-col gap-4 w-full">
                  {[...conversation]
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() -
                        new Date(b.date).getTime(),
                    )
                    .map((item, index) => {
                      if (item.type === "comment") {
                        return (
                          <CommentItem
                            key={`${item.type}-${index}`}
                            username={item.username}
                            avatarLink={item.avatarLink}
                            comment={item.comment}
                            date={new Date(item.date).toLocaleDateString()}
                          />
                        );
                      }

                      return (
                        <CommitItemMSG
                          key={`${item.type}-${index}`}
                          username={item.username}
                          avatarLink={item.avatarLink}
                          message={item.message}
                          hash={item.hash}
                        />
                      );
                    })}
                </div>
              </div>

              <ConversationSheet />
            </div>
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
