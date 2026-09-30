import {
	ArrowRight,
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/reui/badge";
import { timeAgo } from "#/lib/time-ago";

interface PullRequestUser {
	id: string;
	username: string;
	avatar?: string | null;
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
	sourceBranch,
	targetBranch,
	createdAt,
	mergedAt,
	closedAt,
	commentCount,
	onNavigate,
}: PullRequestItemProps) {
	const { t } = useTranslation();
	const isOpen = state === "open";
	const isClosed = state === "closed";
	const isMerged = state === "merged";

	return (
		// biome-ignore lint/a11y/useSemanticElements: presentational row wired to onNavigate, not a router link
		<div
			className="group flex cursor-pointer flex-row items-center gap-3 border-b p-3 transition-colors hover:bg-muted/50 last:border-b-0"
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
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					{isOpen ? (
						<GitPullRequest size={16} className="shrink-0 text-green-500" />
					) : isClosed ? (
						<GitPullRequestClosed size={16} className="shrink-0 text-red-500" />
					) : (
						<GitMerge size={16} className="shrink-0 text-purple-400" />
					)}

					<span className="text-base cursor-pointer truncate font-semibold hover:text-blue-400 hover:underline">
						{title}
					</span>
				</div>

				<div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
					<span className="font-medium text-[13px] ml-6">#{number}</span>
					<span>·</span>

					<span>{t("pulls.state.base")}</span>

					<Badge variant="outline" size="sm">
						{targetBranch}
					</Badge>

					<ArrowRight className="size-3 shrink-0" />

					<span>{t("pulls.state.branch")}</span>

					<Badge size="sm" variant="outline">
						{sourceBranch}
					</Badge>

					<span>·</span>

					<span>
						{isMerged && mergedAt
							? t("pulls.state.mergedBy", {
									author: author.username,
									time: timeAgo(mergedAt),
								})
							: isClosed && closedAt
								? t("pulls.state.closedBy", {
										author: author.username,
										time: timeAgo(closedAt),
									})
								: t("pulls.state.openedBy", {
										author: author.username,
										time: timeAgo(createdAt),
									})}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{commentCount > 0 && (
					<span
						className="flex items-center gap-1 text-xs text-muted-foreground"
						title={t("pulls.state.commentCount", {
							count: commentCount,
						})}
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
