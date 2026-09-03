import { format, formatDistanceToNowStrict } from "date-fns";
import { Check, Code2, Copy, GitCommitHorizontal } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard";

type MockCommit = {
	hash: string;
	message: string;
	author: string;
	avatar?: string;
	date: string;
	checksPassed: number;
	checksTotal: number;
};

type DateGroup = {
	dateKey: string;
	label: string;
	commits: MockCommit[];
};

const MOCK_COMMITS: MockCommit[] = [
	{
		hash: "c33e686",
		message:
			"feat: implement pull requests feature with UI components and routing",
		author: "thfoxcost",
		date: "2026-09-01T10:20:00-07:00",
		checksPassed: 1,
		checksTotal: 1,
	},
	{
		hash: "c1d4677",
		message:
			"feat: update New Pull Request indicator UI with improved messaging and icon",
		author: "thfoxcost",
		date: "2026-09-01T15:05:00-07:00",
		checksPassed: 1,
		checksTotal: 1,
	},
	{
		hash: "907a1ed",
		message:
			"feat: implement pull requests feature with UI components, routing, and detailed views",
		author: "thfoxcost",
		date: "2026-09-02T18:40:00-07:00",
		checksPassed: 1,
		checksTotal: 1,
	},
];

function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}

function groupByDate(commits: MockCommit[]): DateGroup[] {
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
}: {
	commit: MockCommit;
	isLast: boolean;
}) {
	const { isCopied, copyToClipboard } = useCopyToClipboard();

	return (
		<div
			className={`flex items-center justify-between gap-2 px-4 py-3 ${
				!isLast ? "border-b" : ""
			}`}
		>
			<div className="min-w-0">
				<p className="truncate text-base font-medium leading-tight">
					{commit.message}
				</p>

				<div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
					<Avatar className="size-6">
						{commit.avatar ? (
							<AvatarImage
								src={commit.avatar}
								alt={commit.author}
							/>
						) : null}

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

					<span className="mx-0.5">·</span>

					<Check className="size-4 shrink-0 text-green-600" />

					<span className="shrink-0">
						{commit.checksPassed}/{commit.checksTotal}
					</span>
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<span className="font-mono text-sm text-muted-foreground">
					{commit.hash}
				</span>

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

				<button
					type="button"
					aria-label="View commit"
					className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<Code2 className="size-4" />
				</button>
			</div>
		</div>
	);
}

function Commits() {
	const groupedCommits = useMemo(
		() => groupByDate(MOCK_COMMITS),
		[],
	);

	return (
		<div className="w-full">
			<div className="space-y-[-4px]">
				{groupedCommits.map((group, index) => (
					<section
						key={group.dateKey}
						className="relative pl-6"
					>
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

						<p className="pt-2 text-sm text-muted-foreground">
							{group.label}
						</p>

						<div className="mt-1.5 overflow-hidden rounded-lg border">
							{group.commits.map((commit, i) => (
								<CommitRow
									key={commit.hash}
									commit={commit}
									isLast={
										i === group.commits.length - 1
									}
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