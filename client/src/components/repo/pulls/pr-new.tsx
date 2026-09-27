import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Circle,
  Loader2,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Contributor } from "#/components/repo/contributor-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Textarea } from "#/components/ui/textarea";
import { useCreatePullRequest } from "#/hooks/PRs/use-create-pull";
import { usePRCommits } from "#/hooks/PRs/use-pr-commits";
import type { BranchCompare } from "#/hooks/PRs/use-pull-compare";
import { useRepoData } from "#/hooks/useRepoData";
import { authClient } from "#/lib/auth-client";

interface PrNewProps {
  owner: string;
  repo: string;
  base: string;
  source: string;
  compare: BranchCompare | undefined;
  duplicatePR: { duplicate: boolean; number: number | null } | undefined;
}

type SelectedLabel = { id: string; text: string };

type LabelOption = {
  name: string;
  description: string;
  dot: string;
};

const labelStyles: Record<string, string> = {
  bug: "border-red-500/70 bg-red-500/10 text-red-400",
  documentation: "border-blue-500/70 bg-blue-500/10 text-blue-400",
  duplicate: "border-gray-500/70 bg-gray-500/10 text-gray-400",
  enhancement: "border-cyan-500/70 bg-cyan-500/10 text-cyan-400",
  "good first issue": "border-violet-500/70 bg-violet-500/10 text-violet-400",
  question: "border-pink-500/70 bg-pink-500/10 text-pink-400",
  invalid: "border-yellow-500/70 bg-yellow-500/10 text-yellow-400",
};

const defaultLabelOptions: LabelOption[] = [
  {
    name: "bug",
    description: "Something isn't working correctly",
    dot: "fill-red-500 text-red-500",
  },
  {
    name: "documentation",
    description: "Documentation improvements or updates",
    dot: "fill-blue-500 text-blue-500",
  },
  {
    name: "duplicate",
    description: "This issue already exists",
    dot: "fill-gray-400 text-gray-400",
  },
  {
    name: "enhancement",
    description: "A new feature or improvement",
    dot: "fill-cyan-500 text-cyan-500",
  },
  {
    name: "good first issue",
    description: "Good for new contributors",
    dot: "fill-violet-500 text-violet-500",
  },
  {
    name: "question",
    description: "Further information is needed",
    dot: "fill-pink-500 text-pink-500",
  },
  {
    name: "invalid",
    description: "This issue doesn't seem valid",
    dot: "fill-yellow-500 text-yellow-500",
  },
];

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function branchToTitle(branch: string): string {
  const prefixes = ["feat/", "fix/", "chore/", "refactor/", "docs/", "test/", "ci/", "build/", "perf/"];
  let name = branch;
  for (const prefix of prefixes) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function PrNew({
  owner,
  repo,
  base,
  source,
  compare,
  duplicatePR,
}: PrNewProps) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const createPR = useCreatePullRequest(owner, repo);
  const { data: repoData } = useRepoData(owner, repo);

  const [title, setTitle] = useState(() => (source ? branchToTitle(source) : ""));
  const [description, setDescription] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const descInitialized = useRef(false);

  const { data: branchCommits } = usePRCommits(
    owner,
    repo,
    base,
    source,
  );

  useEffect(() => {
    if (descInitialized.current) return;
    if (branchCommits && branchCommits.length > 0) {
      const desc = branchCommits
        .map((c) => `- ${c.message.split("\n")[0]}`)
        .join("\n");
      setDescription(desc);
      descInitialized.current = true;
    }
  }, [branchCommits]);

  const [selectedReviewers, setSelectedReviewers] = useState<Contributor[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<Contributor[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<SelectedLabel[]>([]);

  const [reviewerQuery, setReviewerQuery] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [labelQuery, setLabelQuery] = useState("");

  const contributors = repoData?.contributors ?? [];

  const { data: repoLabels } = useQuery({
    queryKey: ["repo-labels", owner, repo],
    queryFn: async (): Promise<{ name: string; color: string | null }[]> => {
      const res = await fetch(
        `/api/repos/${owner}/${repo}/labels`,
      );
      if (!res.ok) throw new Error("Failed to fetch labels");
      const json = (await res.json()) as {
        labels?: { name: string; color: string | null }[];
      };
      return json.labels ?? [];
    },
  });

  const availableLabels = useMemo(() => {
    const existing = repoLabels ?? [];
    const existingNames = new Set(existing.map((l) => l.name.toLowerCase()));

    const fromRepo = existing.map((label) => {
      const option = defaultLabelOptions.find(
        (o) => o.name.toLowerCase() === label.name.toLowerCase(),
      );
      return {
        name: label.name,
        description: option?.description ?? "Label on this repository",
        dot: option?.dot ?? "fill-gray-400 text-gray-400",
      };
    });

    const defaults = defaultLabelOptions.filter(
      (o) => !existingNames.has(o.name.toLowerCase()),
    );
    return [...fromRepo, ...defaults];
  }, [repoLabels]);

  const filteredReviewers = useMemo(() => {
    const q = reviewerQuery.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter((c) => c.username.toLowerCase().includes(q));
  }, [contributors, reviewerQuery]);

  const filteredAssignees = useMemo(() => {
    const q = assigneeQuery.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter((c) => c.username.toLowerCase().includes(q));
  }, [contributors, assigneeQuery]);

  const filteredLabels = useMemo(() => {
    const q = labelQuery.trim().toLowerCase();
    if (!q) return availableLabels;
    return availableLabels.filter((l) => l.name.toLowerCase().includes(q));
  }, [availableLabels, labelQuery]);

  const hasExactLabelMatch = useMemo(() => {
    const q = labelQuery.trim().toLowerCase();
    if (!q) return false;
    return availableLabels.some((l) => l.name.toLowerCase() === q);
  }, [availableLabels, labelQuery]);

  const isSameBranch = base === source;
  const isConflicting = compare && !compare.mergeable;
  const isAhead = compare && (compare.ahead > 0 || compare.remerge);
  const isDuplicate = duplicatePR?.duplicate === true;
  const isDisabled =
    isSameBranch || !isAhead || isDuplicate || createPR.isPending || isChecking;

  function toggleReviewer(contributor: Contributor) {
    setSelectedReviewers((prev) =>
      prev.some((r) => r.id === contributor.id)
        ? prev.filter((r) => r.id !== contributor.id)
        : [...prev, contributor],
    );
  }

  function toggleAssignee(contributor: Contributor) {
    setSelectedAssignees((prev) =>
      prev.some((a) => a.id === contributor.id)
        ? prev.filter((a) => a.id !== contributor.id)
        : [...prev, contributor],
    );
  }

  function addLabel(labelName: string) {
    if (selectedLabels.some((l) => l.text === labelName)) return;
    setSelectedLabels([
      ...selectedLabels,
      { id: crypto.randomUUID(), text: labelName },
    ]);
    setLabelQuery("");
  }

  function removeLabel(labelId: string) {
    setSelectedLabels(selectedLabels.filter((l) => l.id !== labelId));
  }

  function addCustomLabel() {
    const q = labelQuery.trim();
    if (
      q &&
      !selectedLabels.some((l) => l.text.toLowerCase() === q.toLowerCase())
    ) {
      addLabel(q);
    }
  }

  const handleCreate = () => {
    if (!title.trim() || isDisabled || isChecking) return;

    setIsChecking(true);

    createPR.mutate(
      {
        title: title.trim(),
        description,
        sourceBranch: source,
        targetBranch: base,
        labels: selectedLabels.map((l) => l.text),
        assignees: selectedAssignees.map((a) => a.id),
        reviewers: selectedReviewers.map((r) => r.id),
      },
      {
        onSuccess: (pr) => {
          navigate({ to: `/${owner}/${repo}/pulls/${pr.number}` });
        },
        onError: () => {
          setIsChecking(false);
        },
      },
    );
  };

  const handleCancel = () => {
    navigate({ to: `/${owner}/${repo}/pulls` });
  };

  return (
    <div className="flex max-w-auto items-start gap-3 mt-2">
      <Avatar className="shrink-0 size-10">
        {session?.user.image ? (
          <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
        ) : null}
        <AvatarFallback>
          {session?.user.name
            ? session.user.name.slice(0, 2).toUpperCase()
            : "U"}
        </AvatarFallback>
      </Avatar>

		<div className="grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          {isSameBranch && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              Base and compare branches must be different.
            </div>
          )}

          {isDuplicate && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-500">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                A pull request already exists for{" "}
                <span className="font-semibold">{source}</span> →{" "}
                <span className="font-semibold">{base}</span> (#
                {duplicatePR.number}). Creating another would be a duplicate.
              </span>
            </div>
          )}

          {isConflicting && (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-500">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4 shrink-0" />
                These branches cannot be merged cleanly.
              </div>
              {compare.conflicts && compare.conflicts.length > 0 && (
                <ul className="mt-1.5 ml-6 list-disc text-xs text-amber-600/80 dark:text-amber-500/80">
                  {compare.conflicts.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {compare && !isSameBranch && compare.remerge && (
            <div className="flex items-center gap-2 rounded-md border border-purple-500/50 bg-purple-500/10 px-3 py-2 text-sm text-purple-600 dark:text-purple-400">
              This branch was previously merged. The changes shown are from the
              original merge.
            </div>
          )}

          {compare && !isSameBranch && !compare.remerge && !isAhead && (
            <div className="flex items-center gap-2 rounded-md border bg-accent/20 px-3 py-2 text-sm text-muted-foreground">
              There are no new commits on{" "}
              <span className="font-semibold">{source}</span> compared to{" "}
              <span className="font-semibold">{base}</span>.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pr-title">
              Add a title
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pr-title"
              type="text"
              placeholder="Pull request title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-description">Add a description</Label>
            <Textarea
              id="pr-description"
              placeholder="Type your description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-40 resize-y"
            />
          </div>

          {createPR.isError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {createPR.error.message || "Failed to create pull request."}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={createPR.isPending || isChecking}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-700 text-white hover:bg-green-800"
              onClick={handleCreate}
              disabled={isDisabled || !title.trim()}
            >
              {(createPR.isPending || isChecking) && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              {isChecking && !createPR.isPending
                ? "Checking mergeability..."
                : "Create pull request"}
            </Button>
          </div>
        </div>

        <div className="sticky top-4 self-start text-sm">
          {/* Reviewers */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-2 text-muted-foreground"
              >
                <span className="text-xs font-bold">Reviewers</span>
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Select reviewers</DropdownMenuLabel>
                <Input
                  placeholder="Filter reviewers"
                  value={reviewerQuery}
                  onChange={(e) => setReviewerQuery(e.target.value)}
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {filteredReviewers.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No contributors found
                  </DropdownMenuItem>
                ) : (
                  filteredReviewers.map((contributor) => (
                    <DropdownMenuItem
                      key={contributor.id || contributor.username}
                      className="cursor-pointer"
                      onClick={() => toggleReviewer(contributor)}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar size="sm">
                          {contributor.avatar ? (
                            <AvatarImage
                              src={contributor.avatar}
                              alt={contributor.username}
                            />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(contributor.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contributor.username}</span>
                        {selectedReviewers.some(
                          (r) => r.id === contributor.id,
                        ) && <Check size={14} className="ml-auto" />}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Selected reviewers */}
          <div className="mt-1 px-1">
            {selectedReviewers.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No reviewers
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1">
                {selectedReviewers.map((reviewer) => (
                  <button
                    key={reviewer.id}
                    type="button"
                    title={`Remove ${reviewer.username}`}
                    onClick={() => toggleReviewer(reviewer)}
                    className="rounded-full transition-opacity hover:opacity-70"
                  >
                    <Avatar size="sm">
                      {reviewer.avatar ? (
                        <AvatarImage
                          src={reviewer.avatar}
                          alt={reviewer.username}
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(reviewer.username)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Assignees */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-2 text-muted-foreground"
              >
                <span className="text-xs font-bold">Assignees</span>
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Select assignees</DropdownMenuLabel>
                <Input
                  placeholder="Filter assignees"
                  value={assigneeQuery}
                  onChange={(e) => setAssigneeQuery(e.target.value)}
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {filteredAssignees.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No contributors found
                  </DropdownMenuItem>
                ) : (
                  filteredAssignees.map((contributor) => (
                    <DropdownMenuItem
                      key={contributor.id || contributor.username}
                      className="cursor-pointer"
                      onClick={() => toggleAssignee(contributor)}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar size="sm">
                          {contributor.avatar ? (
                            <AvatarImage
                              src={contributor.avatar}
                              alt={contributor.username}
                            />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(contributor.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contributor.username}</span>
                        {selectedAssignees.some(
                          (a) => a.id === contributor.id,
                        ) && <Check size={14} className="ml-auto" />}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Selected assignees */}
          <div className="mt-1 px-1">
            {selectedAssignees.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No one assigned
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1">
                {selectedAssignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    type="button"
                    title={`Remove ${assignee.username}`}
                    onClick={() => toggleAssignee(assignee)}
                    className="rounded-full transition-opacity hover:opacity-70"
                  >
                    <Avatar size="sm">
                      {assignee.avatar ? (
                        <AvatarImage
                          src={assignee.avatar}
                          alt={assignee.username}
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(assignee.username)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Labels */}
          <div className="space-y-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-between px-2 text-muted-foreground"
                >
                  <span className="text-xs font-bold">Labels</span>
                  <Settings className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-1">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5">
                    Select labels
                  </DropdownMenuLabel>
                  <Input
                    placeholder="Filter labels"
                    className="h-8"
                    value={labelQuery}
                    onChange={(e) => setLabelQuery(e.target.value)}
                  />
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuGroup>
                  {filteredLabels.map((label, index) => (
                    <div key={label.name}>
                      <DropdownMenuItem
                        className="cursor-pointer flex-col items-start gap-0.5 px-2 py-1.5"
                        onClick={() => addLabel(label.name)}
                      >
                        <div className="flex items-center gap-2">
                          <Circle className={`size-3 ${label.dot}`} />
                          <span className="text-xs">{label.name}</span>
                        </div>
                        <span className="pl-5 text-[11px] leading-tight text-muted-foreground">
                          {label.description}
                        </span>
                      </DropdownMenuItem>
                      {index < filteredLabels.length - 1 && (
                        <DropdownMenuSeparator className="my-0.5" />
                      )}
                    </div>
                  ))}

                  {labelQuery.trim() && !hasExactLabelMatch && (
                    <>
                      <DropdownMenuSeparator className="my-0.5" />
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 px-2 py-1.5 font-medium"
                        onClick={addCustomLabel}
                      >
                        <span className="text-xs">
                          + Add "{labelQuery.trim()}"
                        </span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {filteredLabels.length === 0 && !labelQuery.trim() && (
                    <DropdownMenuItem disabled>
                      No labels found
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected labels */}
            {selectedLabels.length === 0 ? (
              <span className="px-2 text-xs text-muted-foreground">
                No labels
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5 px-2">
                {selectedLabels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className={`gap-1 px-2 py-0.5 text-xs ${labelStyles[label.text] ?? "border-border bg-muted/30 text-foreground"}`}
                  >
                    {label.text}
                    <button
                      type="button"
                      className="ml-0.5 rounded-sm opacity-60 transition-opacity hover:opacity-100"
                      onClick={() => removeLabel(label.id)}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrNew;
