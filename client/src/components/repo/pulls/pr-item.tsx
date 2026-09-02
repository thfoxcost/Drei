import { GitMerge, GitPullRequest, MessageSquare } from "lucide-react";
import { timeAgo } from "#/lib/time-ago";

interface PullRequestUser {
	id: number;
	username: string;
	displayName?: string;
	avatar?: string;
}

interface PullRequestItemProps {
	number: number;
	title: string;
	description?: string;
	state: "open" | "closed" | "merged";
	author: PullRequestUser;
	sourceBranch: string;
	targetBranch: string;
	createdAt: string;
	updatedAt: string;
	mergedAt?: string | null;
	closedAt?: string | null;
	commentCount: number;
	repoLabel?: string;
	showAuthorAvatar?: boolean;
	onNavigate?: (number: number) => void;
}


function PullRequestItem({
	title,
	number,
	state,
	author,
	createdAt,
	mergedAt,
	closedAt,
	commentCount,
	repoLabel,
	onNavigate,
}: PullRequestItemProps) {
	const isOpen = state === "open";
	const isClosed = state === "closed";
	const isMerged = state === "merged";

	const iconClassName = isOpen
		? "text-green-500"
		: "text-purple-400";

	return (
		// biome-ignore lint/a11y/useSemanticElements: presentational row wired to onNavigate, not a router link
		<div
			className="group flex cursor-pointer flex-row items-center gap-3 border-b p-3 transition-colors hover:bg-muted/50"
			role="link"
			tabIndex={0}
			onClick={() => onNavigate?.(number)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onNavigate?.(number);
				}
			}}
		>
			{isOpen ? (
				<GitPullRequest
					size={18}
					className={iconClassName}
				/>
			) : (
				<GitMerge
					size={18}
					className={iconClassName}
				/>
			)}

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="cursor-pointer truncate font-semibold hover:text-blue-400 hover:underline">
						{title}
					</span>
				</div>

				<div className="mt-1 text-xs text-muted-foreground">
					{repoLabel ? (
						<span className="font-medium">
							{repoLabel} ·{" "}
						</span>
					) : null}

					#{number} ·{" "}

					{isMerged && mergedAt
						? `${author.username} merged ${timeAgo(mergedAt)}`
						: isClosed && closedAt
							? `${author.username} closed ${timeAgo(closedAt)}`
							: `${author.username} opened ${timeAgo(createdAt)}`}
				</div>
			</div>

			<div className="flex items-center gap-2">
				{commentCount > 0 && (
					<span
						className="flex items-center gap-1 text-xs text-muted-foreground"
						title={`${commentCount} comment${
							commentCount === 1 ? "" : "s"
						}`}
					>
						<MessageSquare size={14} />
						{commentCount}
					</span>
				)}
			</div>
		</div>
	);
}

export default PullRequestItem;