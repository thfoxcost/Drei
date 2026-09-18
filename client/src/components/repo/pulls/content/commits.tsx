import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Check, Code2, Copy, GitCommitHorizontal } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Spinner } from "#/components/ui/spinner";
import { usePRCommits } from "#/hooks/PRs/use-pr-commits";
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard";
import type { Commit } from "#/types/repo";

type DateGroup = {
	dateKey: string;
	label: string;
	commits: Commit[];
};

function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}

function groupByDate(commits: Commit[]): DateGroup[] {
	const groups: DateGroup[] = [];
	const byKey = new Map<string, DateGroup>();

	for (const commit of commits) {
		const date = new Date(commit.date);
		const dateKey = format(date, "yyyy-MM-dd");
		const label = `Commits on ${format(date, "MMM d, yyyy")}`;

		let group = byKey.get(dateKey);

		if (!group) {
			group = { dateKey, label, commits: [] };
			byKey.set(dateKey, group);
			groups.push(group);
		}

		group.commits.push(commit);
	}

	return groups;
}

function CommitRow({
	commit,
	isLast,
	owner,
	repo,
}: {
	commit: Commit;
	isLast: boolean;
	owner: string;
	repo: string;
}) {
	const { isCopied, copyToClipboard } = useCopyToClipboard();
	const shortHash = commit.hash.slice(0, 7);
	const title = commit.message.split("\n")[0];

	return (
		<div
			className={`flex items-center justify-between gap-2 px-4 py-3 ${
				!isLast ? "border-b" : ""
			}`}
		>
			<div className="min-w-0 flex-1">
				<Link
					to={`/${owner}/${repo}/commits/${commit.hash}`}
					className="block truncate text-base font-medium leading-tight hover:text-blue-400 hover:underline"
				>
					{title}
				</Link>

				<div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
					<Avatar className="size-6">
						<AvatarFallback className="text-[11px]">
							{getInitials(commit.author)}
						</AvatarFallback>
					</Avatar>

					<span className="truncate">
						{commit.author} committed{" "}
						{formatDistanceToNowStrict(new Date(commit.date), {
							addSuffix: true,
						})}
					</span>


				</div>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<Link
					to={`/${owner}/${repo}/commits/${commit.hash}`}
					className="font-mono text-sm text-muted-foreground hover:text-foreground"
				>
					{shortHash}
				</Link>

				<button
					type="button"
					onClick={() => copyToClipboard(commit.hash)}
					aria-label={isCopied ? "Copied" : "Copy commit hash"}
					className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					{isCopied ? (
						<Check className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
				</button>

				<Link
					to={`/${owner}/${repo}/commits/${commit.hash}`}
					aria-label="View commit"
					className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<Code2 className="size-4" />
				</Link>
			</div>
		</div>
	);
}

interface CommitsProps {
	owner: string;
	repo: string;
	base: string;
	head: string;
}

function Commits({ owner, repo, base, head }: CommitsProps) {
	const {
		data: commits,
		isLoading,
		isError,
	} = usePRCommits(owner, repo, base, head);

	const groupedCommits = useMemo(() => groupByDate(commits ?? []), [commits]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8 text-muted-foreground">
				<Spinner className="mr-2" />
				<span>Loading commits...</span>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="py-8 text-center text-sm text-muted-foreground">
				Failed to load commits.
			</div>
		);
	}

	if (!commits || commits.length === 0) {
		return (
			<div className="py-8 text-center text-sm text-muted-foreground">
				No commits found between these branches.
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="space-y-[-4px]">
				{groupedCommits.map((group, index) => (
					<section key={group.dateKey} className="relative pl-6">
						<span
							aria-hidden="true"
							className={`absolute bottom-0 left-2.5 w-px bg-muted-foreground/40 ${
								index === 0 ? "top-7" : "top-1"
							}`}
						/>

						<GitCommitHorizontal
							aria-hidden="true"
							className="absolute left-0 top-2 size-5 rounded-full bg-background text-muted-foreground"
						/>

						<p className="pt-2 text-sm text-muted-foreground">{group.label}</p>

						<div className="mt-1.5 overflow-hidden rounded-lg border">
							{group.commits.map((commit, i) => (
								<CommitRow
									key={commit.hash}
									commit={commit}
									owner={owner}
									repo={repo}
									isLast={i === group.commits.length - 1}
								/>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}

export default Commits;
