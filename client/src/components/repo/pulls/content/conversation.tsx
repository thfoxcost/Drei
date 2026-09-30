import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Check,
	Ellipsis,
	Eye,
	EyeOff,
	GitCommit,
	ImagePlus,
	MessageSquare,
	Pencil,
	Settings,
	Trash2,
	TriangleAlert,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Markdown } from "#/components/repo/issues/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Switch } from "#/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { useRepoData } from "#/hooks/useRepoData";
import type { PullRequest } from "#/types/prs";
import { timeAgo } from "@/lib/time-ago";
import type {
	ConversationBranchDeleted,
	ConversationComment,
	ConversationCommit,
	ConversationMerged,
	ConversationOpened,
	ConversationPush,
	ConversationReverted,
	ConversationReview,
	ConversationStateChange,
} from "./types/conversation";

function linkifyIssueRefs(
	content: string,
	username: string,
	repo: string,
): string {
	return content.replace(/#(\d+)\b/g, `[#$1](/${username}/${repo}/issues/$1)`);
}

export default function CommentItem({
	commentId,
	username,
	avatarLink,
	comment,
	date,
	isAuthor,
	onEdit,
	onDelete,
	onQuoteReply,
	issueBasePath,
}: Omit<ConversationComment, "type">) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [editBody, setEditBody] = useState(comment);
	const [saving, setSaving] = useState(false);
	const [hidden, setHidden] = useState(false);

	async function handleSave() {
		if (!onEdit || !editBody.trim()) return;
		setSaving(true);
		try {
			onEdit(commentId, editBody);
			setEditing(false);
		} finally {
			setSaving(false);
		}
	}

	function handleCopyMarkdown() {
		navigator.clipboard.writeText(comment);
		toast.success(t("pulls.conversation.markdownCopied"));
	}

	function handleQuoteReply() {
		const quoted = comment
			.split("\n")
			.map((line) => `> ${line}`)
			.join("\n");
		onQuoteReply?.(`${quoted}\n\n`);
	}

	return (
		<div
			className={`group flex w-full flex-row gap-4 ${hidden ? "opacity-50" : ""}`}
		>
			<Avatar className="size-9">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<div className="flex-1">
				<div className="relative flex items-center rounded-b-none rounded-sm border border-foreground/30 bg-accent/50 p-1 pl-3">
					<div className="absolute left-[-8px] top-3 z-10 size-0 border-y-[7px] border-r-8 border-y-transparent border-r-foreground/30" />
					<div className="absolute left-[-7px] top-[14px] z-20 size-0 border-y-[6px] border-r-[7px] border-y-transparent border-r-accent/50" />

					<div className="flex items-center gap-2">
						{hidden && (
							<Badge
								variant="outline"
								className="h-5 px-1.5 text-[10px] font-medium"
							>
								{t("pulls.conversation.hidden")}
							</Badge>
						)}
						<span className="relative z-30 font-semibold">{username}</span>
						<span className="relative z-30 text-muted-foreground">
							{" "}
							{t("pulls.conversation.commented")}{" "}
							<span className="text-xs underline">{timeAgo(date)}</span>
						</span>
					</div>

					<div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
									aria-label={t("pulls.conversation.commentActions")}
								>
									<Ellipsis size={16} />
								</button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								side="right"
								align="start"
								className="min-w-44"
							>
								<DropdownMenuItem onClick={handleCopyMarkdown}>
									{t("pulls.conversation.copyMarkdown")}
								</DropdownMenuItem>

								<DropdownMenuItem onClick={handleQuoteReply}>
									{t("pulls.conversation.quoteReply")}
								</DropdownMenuItem>

								<DropdownMenuItem>
									{t("pulls.conversation.referenceInNewIssue")}
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem onClick={() => setHidden((h) => !h)}>
									{hidden ? (
										<>
											<Eye size={14} />
											{t("pulls.conversation.unhide")}
										</>
									) : (
										<>
											<EyeOff size={14} />
											{t("pulls.conversation.hide")}
										</>
									)}
								</DropdownMenuItem>

								{isAuthor && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => {
												setEditBody(comment);
												setEditing(true);
											}}
										>
											<Pencil size={14} />
											{t("common.actions.edit")}
										</DropdownMenuItem>
										<DropdownMenuItem
											variant="destructive"
											onClick={() => onDelete?.(commentId)}
										>
											<Trash2 size={14} />
											{t("common.actions.delete")}
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{!hidden && (
					<div className="rounded-b-sm border border-foreground/30 border-t-0 p-2">
						{editing ? (
							<div className="space-y-2">
								<Textarea
									rows={4}
									value={editBody}
									onChange={(e) => setEditBody(e.target.value)}
								/>
								<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setEditing(false)}
									disabled={saving}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button
									size="sm"
									onClick={handleSave}
									disabled={saving || !editBody.trim()}
								>
									{saving ? <Spinner /> : t("common.actions.save")}
								</Button>
								</div>
							</div>
						) : (
							<Markdown
								content={
									issueBasePath
										? linkifyIssueRefs(
												comment,
												issueBasePath.username,
												issueBasePath.repo,
											)
										: comment
								}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export function CommitItemMSG({
	username,
	avatarLink,
	message,
	hash,
	owner,
	repo,
}: Omit<ConversationCommit, "type">) {
	const commitPath = `/${owner}/${repo}/commits/${hash}`;

	return (
		<div className="ml-13 flex flex-row items-center gap-2 text-sm">
			<div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<GitCommit className="size-4" />
			</div>

			<Avatar className="size-6">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<Link
				to={commitPath}
				className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
			>
				{message}
			</Link>

			<Link
				to={commitPath}
				className="ml-auto shrink-0 cursor-pointer font-mono text-xs text-muted-foreground hover:underline"
			>
				{hash.slice(0, 7)}
			</Link>
		</div>
	);
}

export function ReviewEventItem({
	reviewId,
	username,
	avatarLink,
	date,
	state,
	body,
	isAuthor = false,
	onDelete,
	onQuoteReply,
}: Omit<ConversationReview, "type">) {
	const { t } = useTranslation();
	const isApproved = state === "approved";
	const isChangesRequested = state === "changes_requested";

	const iconBg = isApproved
		? "bg-green-500/10"
		: isChangesRequested
			? "bg-yellow-500/10"
			: "bg-muted";

	const iconColor = isApproved
		? "text-green-500"
		: isChangesRequested
			? "text-yellow-500"
			: "text-muted-foreground";

	const actionText = isApproved
		? t("pulls.conversation.approvedChanges")
		: isChangesRequested
			? t("pulls.conversation.requestedChanges")
			: t("pulls.conversation.commented");

	function handleCopyMarkdown() {
		navigator.clipboard.writeText(body);
		toast.success(t("pulls.conversation.markdownCopied"));
	}

	function handleQuoteReply() {
		const quoted = body
			.split("\n")
			.map((line) => `> ${line}`)
			.join("\n");
		onQuoteReply?.(`${quoted}\n\n`);
	}

	return (
		<div className="ml-13 group flex flex-col gap-2">
			<div className="flex items-center justify-between text-sm">
				<div className="flex flex-row items-center gap-2 text-sm">
					{isApproved ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							className="text-green-500"
						>
							<g fill="none">
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.293-1.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"
									fill="currentColor"
								/>
							</g>
						</svg>
					) : isChangesRequested ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="25"
							height="25"
							viewBox="0 0 512 512"
							className="text-yellow-500"
						>
							<path
								fill="currentColor"
								d="M449.07 399.08L278.64 82.58c-12.08-22.44-44.26-22.44-56.35 0L51.87 399.08A32 32 0 0 0 80 446.25h340.89a32 32 0 0 0 28.18-47.17m-198.6-1.83a20 20 0 1 1 20-20a20 20 0 0 1-20 20m21.72-201.15l-5.74 122a16 16 0 0 1-32 0l-5.74-121.95a21.73 21.73 0 0 1 21.5-22.69h.21a21.74 21.74 0 0 1 21.73 22.7Z"
							/>
						</svg>
					) : (
						<div
							className={`flex size-7 items-center justify-center rounded-full ${iconBg} ${iconColor}`}
						>
							<MessageSquare size={16} />
						</div>
					)}

					<Avatar className="size-6">
						<AvatarImage src={avatarLink} />
						<AvatarFallback className="text-[9px]">
							{username.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					<span className="font-semibold">{username}</span>

					<span className="text-muted-foreground">{actionText}</span>

					<span className="text-xs text-muted-foreground">{timeAgo(date)}</span>
				</div>

				<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
								aria-label={t("pulls.conversation.reviewActions")}
							>
								<Ellipsis size={16} />
							</button>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							side="right"
							align="start"
							className="min-w-44"
						>
							<DropdownMenuItem onClick={handleCopyMarkdown}>
								{t("pulls.conversation.copyMarkdown")}
							</DropdownMenuItem>

							<DropdownMenuItem onClick={handleQuoteReply}>
								{t("pulls.conversation.quoteReply")}
							</DropdownMenuItem>

							{isAuthor && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										variant="destructive"
										onClick={() => onDelete?.(reviewId)}
									>
										<Trash2 size={14} />
										{t("common.actions.delete")}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{body && (
				<div
					className={`ml-9 rounded-sm border px-2 py-1 ${isApproved ? "border-green-500/30 bg-green-500/5" : isChangesRequested ? "border-yellow-500/30 bg-yellow-500/5" : "border-foreground/30 bg-accent/50"}`}
				>
					<Markdown content={body} />
				</div>
			)}
		</div>
	);
}

type MergeState = "checking" | "mergeable" | "conflicted";

type CheckAndMergeItemProps = {
	mergeState: MergeState;
	disabled?: boolean;
	onMerge?: () => void;
	isMerging?: boolean;
};

export function CheckAndMergeItem({
	mergeState,
	disabled = false,
	onMerge,
	isMerging = false,
}: CheckAndMergeItemProps) {
	const { t } = useTranslation();
	const isChecking = mergeState === "checking";
	const isMergeable = mergeState === "mergeable";
	const isConflicted = mergeState === "conflicted";

	return (
		<div className="ml-9 group flex w-full flex-row gap-4">
			<div
				className={`flex size-11 shrink-0 items-center justify-center rounded-lg p-2 ${
					isMergeable
						? "bg-green-500/80"
						: isConflicted
							? "bg-red-500/80"
							: "bg-yellow-500/90"
				}`}
			>
				{isConflicted ? (
					<svg
						className="size-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
					>
						<path d="M12 6h4a2 2 0 0 1 2 2v7M6 12v9M9 3L3 9m6 0L3 3" />
						<circle cx="18" cy="18" r="3" />
					</svg>
				) : isChecking ? (
					<svg
						className="size-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<g
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						>
							<circle cx="18" cy="18" r="3" />
							<circle cx="6" cy="6" r="3" />
							<path d="M6 21V9a9 9 0 0 0 9 9" />
						</g>
					</svg>
				) : (
					<svg
						className="size-5 text-white"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<g
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						>
							<circle cx="18" cy="18" r="3" />
							<circle cx="6" cy="6" r="3" />
							<path d="M6 21V9a9 9 0 0 0 9 9" />
						</g>
					</svg>
				)}
			</div>

			<div
				className={`flex flex-col overflow-hidden rounded-md border ${
					isMergeable
						? "border-green-500/40"
						: isConflicted
							? "border-red-500/40"
							: "border-yellow-500/40"
				}`}
			>
				<div className="flex items-center gap-2 p-4 w-[880px]">
					{isChecking ? (
						<svg
							className="size-10 shrink-0 text-yellow-500"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
						>
							<circle
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="3"
							/>
						</svg>
					) : isMergeable ? (
						<svg
							className="size-10 shrink-0 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								fillRule="evenodd"
								clipRule="evenodd"
								d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.293-1.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"
							/>
						</svg>
					) : (
						<svg
							className="size-10 shrink-0 text-red-500"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m3.535 6.465a1 1 0 0 0-1.414 0L12 10.585l-2.121-2.12a1 1 0 1 0-1.414 1.414L10.585 12l-2.12 2.121a1 1 0 1 0 1.414 1.414L12 13.415l2.121 2.12a1 1 0 1 0 1.414-1.414L13.415 12l2.12-2.121a1 1 0 0 0 0-1.414"
							/>
						</svg>
					)}

					<div className="flex flex-col gap-0.5">
					<span className="text-base font-semibold">
						{isChecking
							? t("pulls.detail.checkingMergeability")
							: isMergeable
								? t("pulls.conversation.mergeability.clean")
								: t("pulls.conversation.mergeability.conflict")}
					</span>

					<span
						className={`text-sm ${
							isConflicted ? "text-foreground" : "text-muted-foreground"
						}`}
					>
						{isChecking
							? t("pulls.conversation.mergeability.checking")
							: isMergeable
								? t("pulls.conversation.mergeability.cleanBody")
								: t("pulls.conversation.mergeability.conflictBody")}
					</span>
					</div>
				</div>

				<div
					className={`flex flex-row items-center bg-accent/15 p-3 border-t ${
						isMergeable
							? "border-green-600"
							: isConflicted
								? "border-red-600"
								: "border-yellow-600"
					}`}
				>
					<Button
						variant="default"
						disabled={!isMergeable || disabled || isMerging}
						className={
							isMergeable
								? "w-fit bg-green-600 text-white hover:bg-green-700"
								: isConflicted
									? "w-fit bg-red-600 text-white"
									: "w-fit bg-yellow-600 text-white"
						}
						onClick={onMerge}
					>
					{isMerging ? (
						<>
							<Spinner className="size-4" />
							{t("pulls.conversation.merge.merging")}
						</>
					) : (
						t("pulls.conversation.merge.button")
					)}
				</Button>

				<span className="ml-3 text-xs text-muted-foreground">
					{t("pulls.conversation.merge.hint")}
				</span>
				</div>
			</div>
		</div>
	);
}

type MergeSuccessBannerProps = {
	sourceBranch: string;
	owner: string;
	repo: string;
	number: number;
	onDeleteBranch: () => void;
	isDeletingBranch: boolean;
	branchDeleted: boolean;
};

export function MergeSuccessBanner({
	sourceBranch,
	onDeleteBranch,
	isDeletingBranch,
	branchDeleted,
}: MergeSuccessBannerProps) {
	const { t } = useTranslation();
	return (
		<div className="ml-9 group flex w-full flex-row gap-4">
			<div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-purple-700 p-2">
				<svg
					className="size-5 text-white"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
				>
					<circle cx="18" cy="18" r="3" />
					<circle cx="6" cy="6" r="3" />
					<path d="M6 21V9a9 9 0 0 0 9 9" />
				</svg>
			</div>

			<div className="flex flex-col overflow-hidden rounded-md border border-purple-600 w-[880px]">
				<div className="flex items-center justify-between gap-4 p-4">
				<div className="flex flex-col gap-0.5">
					<span className="text-base font-semibold">
						{t("pulls.conversation.merge.successTitle")}
					</span>
					<span className="text-sm text-muted-foreground">
						{t("pulls.conversation.merge.branchSafe", {
							branch: sourceBranch,
						})}
					</span>
				</div>

				<Button
					variant="outline"
					size="sm"
					disabled={isDeletingBranch || branchDeleted}
					onClick={onDeleteBranch}
					className="shrink-0"
				>
					{branchDeleted
						? t("pulls.conversation.merge.branchDeleted")
						: t("pulls.conversation.merge.deleteBranch")}
				</Button>
				</div>
			</div>
		</div>
	);
}

export function ConversationSheet({
	pull,
	username,
	repo,
	onUpdate,
}: {
	pull: PullRequest;
	username: string;
	repo: string;
	onUpdate: () => void;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: repoData } = useRepoData(username, repo);

	const [assigneeQuery, setAssigneeQuery] = useState("");
	const [reviewerQuery, setReviewerQuery] = useState("");
	const [labelQuery, setLabelQuery] = useState("");
	const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
	const [isReviewerOpen, setIsReviewerOpen] = useState(false);
	const [isLabelOpen, setIsLabelOpen] = useState(false);

	const contributors = repoData?.contributors ?? [];

	const { data: repoLabels } = useQuery({
		queryKey: ["repo-labels", username, repo],
		queryFn: async (): Promise<
			{ id: number; name: string; color: string | null }[]
		> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/labels`,
			);
			if (!res.ok) throw new Error(t("issues.labels.fetchFailed"));
			const json = (await res.json()) as {
				labels?: { id: number; name: string; color: string | null }[];
			};
			return json.labels ?? [];
		},
	});

	const filteredAssignees = useMemo(() => {
		const query = assigneeQuery.trim().toLowerCase();
		const assignedIds = new Set(pull.assignees?.map((a) => a.id) ?? []);
		const pool = contributors.filter((c) => !assignedIds.has(c.id));
		if (!query) return pool;
		return pool.filter((c) => c.username.toLowerCase().includes(query));
	}, [contributors, assigneeQuery, pull.assignees]);

	const filteredReviewers = useMemo(() => {
		const query = reviewerQuery.trim().toLowerCase();
		const reviewerIds = new Set(pull.reviewers?.map((r) => r.id) ?? []);
		const pool = contributors.filter((c) => !reviewerIds.has(c.id));
		if (!query) return pool;
		return pool.filter((c) => c.username.toLowerCase().includes(query));
	}, [contributors, reviewerQuery, pull.reviewers]);

	const filteredLabels = useMemo(() => {
		const query = labelQuery.trim().toLowerCase();
		const linkedIds = new Set(pull.labels?.map((l) => l.id) ?? []);
		const pool = (repoLabels ?? []).filter((l) => !linkedIds.has(l.id));
		if (!query) return pool;
		return pool.filter((l) => l.name.toLowerCase().includes(query));
	}, [repoLabels, labelQuery, pull.labels]);

	const labelQueryHasExactMatch = useMemo(() => {
		const q = labelQuery.trim().toLowerCase();
		if (!q) return false;
		return (repoLabels ?? []).some((l) => l.name.toLowerCase() === q);
	}, [repoLabels, labelQuery]);

	const invalidateAndRefresh = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: ["pull", username, repo, pull.number],
		});
		queryClient.invalidateQueries({
			queryKey: ["repo-labels", username, repo],
		});
		onUpdate();
	}, [queryClient, username, repo, pull.number, onUpdate]);

	const setAssigneesMutation = useMutation({
		mutationFn: async (assignees: string[]) => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/assignee`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ assignees }),
				},
			);
			if (!res.ok) throw new Error(t("errors.client.updateAssignees"));
		},
		onSuccess: invalidateAndRefresh,
	});

	const setReviewersMutation = useMutation({
		mutationFn: async (reviewers: string[]) => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/reviewers`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ reviewers }),
				},
			);
			if (!res.ok) throw new Error(t("errors.client.updateReviewers"));
		},
		onSuccess: invalidateAndRefresh,
	});

	const setLabelsMutation = useMutation({
		mutationFn: async (labels: number[]) => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/labels`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ labels }),
				},
			);
			if (!res.ok) throw new Error(t("errors.client.updateLabels"));
		},
		onSuccess: invalidateAndRefresh,
	});

	const createLabelMutation = useMutation({
		mutationFn: async ({
			name,
			color,
		}: {
			name: string;
			color: string;
		}): Promise<{ id: number; name: string; color: string }> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/labels`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name, color }),
				},
			);
			if (!res.ok) throw new Error(t("errors.client.createLabel"));
			return res.json();
		},
	});

	const notificationsMutation = useMutation({
		mutationFn: async (notifications: boolean) => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${pull.number}/notifications`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ notifications }),
				},
			);
			if (!res.ok) throw new Error(t("errors.client.updateNotifications"));
		},
		onSuccess: invalidateAndRefresh,
	});

	const assignees = pull.assignees ?? [];
	const reviewers = pull.reviewers ?? [];
	const labels = pull.labels ?? [];
	const participants = pull.participants ?? [];

	function removeAssignee(userId: string) {
		setAssigneesMutation.mutate(
			assignees.filter((a) => a.id !== userId).map((a) => a.id),
		);
	}

	function addAssignee(userId: string) {
		setAssigneesMutation.mutate([...assignees.map((a) => a.id), userId]);
		setAssigneeQuery("");
		setIsAssigneeOpen(false);
	}

	function removeReviewer(userId: string) {
		setReviewersMutation.mutate(
			reviewers.filter((r) => r.id !== userId).map((r) => r.id),
		);
	}

	function addReviewer(userId: string) {
		setReviewersMutation.mutate([...reviewers.map((r) => r.id), userId]);
		setReviewerQuery("");
		setIsReviewerOpen(false);
	}

	function removeLabel(labelId: number) {
		setLabelsMutation.mutate(
			labels.filter((l) => l.id !== labelId).map((l) => l.id),
		);
	}

	function addLabel(labelId: number) {
		setLabelsMutation.mutate([...labels.map((l) => l.id), labelId]);
		setLabelQuery("");
		setIsLabelOpen(false);
	}

	const labelColors = [
		"#d73a4a",
		"#0075ca",
		"#008672",
		"#e4e669",
		"#D876E3",
		"#cfd3d7",
		"#a2eeef",
		"#f9d0c4",
		"#7057ff",
		"#fbca04",
	];

	function getNextLabelColor(): string {
		const existingColors = new Set(
			(repoLabels ?? []).map((l) => l.color?.toLowerCase()),
		);
		return (
			labelColors.find((c) => !existingColors.has(c.toLowerCase())) ??
			labelColors[Math.floor(Math.random() * labelColors.length)]
		);
	}

	function createAndAddLabel() {
		const name = labelQuery.trim();
		if (!name) return;

		const color = getNextLabelColor();

		createLabelMutation.mutate(
			{ name, color },
			{
				onSuccess: (created) => {
					setLabelsMutation.mutate([...labels.map((l) => l.id), created.id]);
					setLabelQuery("");
					setIsLabelOpen(false);
				},
			},
		);
	}

	return (
		<div className="w-[400px]">
			<div className="space-y-1">
				<DropdownMenu open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex w-full items-center justify-between px-2 text-muted-foreground"
						>
							<span className="text-[13px] font-semibold">
								{t("pulls.conversation.assignees")}
							</span>
							<Settings className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[260px]">
						<div className="px-2 py-1">
							<Input
								placeholder={t("pulls.conversation.searchContributors")}
								value={assigneeQuery}
								onChange={(e) => setAssigneeQuery(e.target.value)}
								className="h-7 text-xs"
							/>
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							{filteredAssignees.length === 0
								? t("pulls.conversation.noContributors")
								: t("pulls.conversation.contributors")}
						</DropdownMenuLabel>
						{filteredAssignees.map((contributor) => (
							<DropdownMenuItem
								key={contributor.id}
								onClick={() => addAssignee(contributor.id)}
								className="flex items-center gap-2"
							>
								<Avatar className="size-5">
									<AvatarImage src={contributor.avatar} />
									<AvatarFallback className="text-[10px]">
										{contributor.username.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="text-xs">{contributor.username}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{assignees.length > 0 && (
					<div className="flex flex-wrap gap-1.5 px-2">
						{assignees.map((assignee) => (
							<div
								key={assignee.id}
								className="flex items-center gap-1.5 rounded-md bg-muted/50 p-1 text-xs"
							>
								<Avatar className="size-5">
									<AvatarImage src={assignee.avatar} />
									<AvatarFallback className="text-[9px]">
										{assignee.username.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">{assignee.username}</span>
								<button
									type="button"
									onClick={() => removeAssignee(assignee.id)}
									className="ml-0.5 text-muted-foreground hover:text-foreground"
								>
									<X className="size-3" />
								</button>
							</div>
						))}
					</div>
				)}

				{assignees.length === 0 && (
					<span className="px-2 text-[13px] text-muted-foreground">
						{t("pulls.conversation.noOneAssigned")}
					</span>
				)}
			</div>

			<Separator className="my-2" />

			<div className="space-y-1">
				<DropdownMenu open={isLabelOpen} onOpenChange={setIsLabelOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex w-full items-center justify-between px-2 text-muted-foreground"
						>
							<span className="text-[13px] font-semibold">
								{t("pulls.conversation.labels")}
							</span>
							<Settings className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[260px]">
						<div className="px-2 py-1">
							<Input
								placeholder={t("pulls.conversation.searchLabels")}
								value={labelQuery}
								onChange={(e) => setLabelQuery(e.target.value)}
								className="h-7 text-xs"
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										labelQuery.trim() &&
										!labelQueryHasExactMatch
									) {
										createAndAddLabel();
									}
								}}
							/>
						</div>
						<DropdownMenuSeparator />
						{filteredLabels.length > 0 && (
							<>
								<DropdownMenuLabel className="text-xs text-muted-foreground">
									{t("pulls.conversation.labels")}
								</DropdownMenuLabel>
								{filteredLabels.map((label) => (
									<DropdownMenuItem
										key={label.id}
										onClick={() => addLabel(label.id)}
										className="flex items-center gap-2"
									>
										<div
											className="size-2.5 rounded-full"
											style={{
												backgroundColor: label.color || "#6b7280",
											}}
										/>
										<span className="text-xs">{label.name}</span>
									</DropdownMenuItem>
								))}
							</>
						)}
						{labelQuery.trim() && !labelQueryHasExactMatch && (
							<>
								{filteredLabels.length > 0 && <DropdownMenuSeparator />}
								<DropdownMenuItem
									onClick={createAndAddLabel}
									className="flex items-center gap-2 text-blue-500"
									disabled={createLabelMutation.isPending}
								>
									<span className="text-xs">
										{createLabelMutation.isPending
											? t("pulls.conversation.creating")
											: t("pulls.conversation.addLabel", {
													label: labelQuery.trim(),
												})}
									</span>
								</DropdownMenuItem>
							</>
						)}
						{filteredLabels.length === 0 && !labelQuery.trim() && (
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								{t("pulls.conversation.noLabelsAvailable")}
							</DropdownMenuLabel>
						)}
					</DropdownMenuContent>
				</DropdownMenu>

				{labels.length > 0 && (
					<div className="flex flex-wrap gap-1.5 px-2">
						{labels.map((label) => (
							<div
								key={label.id}
								className="inline-flex items-center gap-1 rounded-full border px-1 text-xs font-medium"
								style={{
									borderColor: `${label.color || "#6b7280"}60`,
									backgroundColor: `${label.color || "#6b7280"}15`,
									color: label.color || "#6b7280",
								}}
							>
								<span className="ml-1">{label.name}</span>
								<button
									type="button"
									onClick={() => removeLabel(label.id)}
									className="ml-0.5 text-muted-foreground hover:text-foreground"
								>
									<X className="size-3" />
								</button>
							</div>
						))}
					</div>
				)}

				{labels.length === 0 && (
					<span className="px-2 text-[13px] text-muted-foreground">
						{t("pulls.conversation.noLabels")}
					</span>
				)}
			</div>

			<Separator className="my-2" />

			<div className="space-y-1">
				<DropdownMenu open={isReviewerOpen} onOpenChange={setIsReviewerOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex w-full items-center justify-between px-2 text-muted-foreground"
						>
							<span className="text-[13px] font-semibold">
								{t("pulls.conversation.reviewers")}
							</span>
							<Settings className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[260px]">
						<div className="px-2 py-1">
							<Input
								placeholder={t("pulls.conversation.searchContributors")}
								value={reviewerQuery}
								onChange={(e) => setReviewerQuery(e.target.value)}
								className="h-7 text-xs"
							/>
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							{filteredReviewers.length === 0
								? t("pulls.conversation.noContributors")
								: t("pulls.conversation.contributors")}
						</DropdownMenuLabel>
						{filteredReviewers.map((contributor) => (
							<DropdownMenuItem
								key={contributor.id}
								onClick={() => addReviewer(contributor.id)}
								className="flex items-center gap-2"
							>
								<Avatar className="size-5">
									<AvatarImage src={contributor.avatar} />
									<AvatarFallback className="text-[10px]">
										{contributor.username.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="text-xs">{contributor.username}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{reviewers.length > 0 && (
					<div className="flex flex-wrap gap-1.5 px-2">
						{reviewers.map((reviewer) => (
							<div
								key={reviewer.id}
								className="flex items-center gap-1.5 rounded-md bg-muted/50 p-1 text-xs"
							>
								<Avatar className="size-5">
									<AvatarImage src={reviewer.avatar} />
									<AvatarFallback className="text-[9px]">
										{reviewer.username.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">{reviewer.username}</span>
								<button
									type="button"
									onClick={() => removeReviewer(reviewer.id)}
									className="ml-0.5 text-muted-foreground hover:text-foreground"
								>
									<X className="size-3" />
								</button>
							</div>
						))}
					</div>
				)}

				{reviewers.length === 0 && (
					<span className="px-2 text-[13px] text-muted-foreground">
						{t("pulls.conversation.noReviewers")}
					</span>
				)}
			</div>

			<Separator className="my-2" />

			<div className="px-2">
				<span className="text-[13px] font-medium">
					{t("pulls.conversation.participantCount", {
						count: participants.length,
					})}
				</span>

				<div className="flex items-center gap-2 mt-2">
					{participants.map((user) => (
						<Avatar key={user.id} className="size-7">
							<AvatarImage src={user.avatar ?? undefined} />
							<AvatarFallback>
								{user.username.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					))}
				</div>
			</div>
			<Separator className="my-2" />
			<div className="flex items-center justify-between px-2">
				<div className="space-y-0.5">
					<span className="text-[13px] font-semibold">
						{t("pulls.conversation.notifications")}
					</span>
					<p className="text-[12px] text-muted-foreground">
						{t("pulls.conversation.notificationsHelp")}
					</p>
				</div>
				<Switch
					checked={pull.notifications}
					onCheckedChange={(checked) => notificationsMutation.mutate(checked)}
				/>
			</div>
		</div>
	);
}

type CommentEditorProps = {
	placeholder?: string;
	disabled?: boolean;
	avatarLink?: string;
	username?: string;
	onSubmit?: (body: string) => void;
	defaultValue?: string;
	uploadUrl?: string;
	onClose?: (body: string) => void;
	onReopen?: () => void;
	isClosed?: boolean;
	isMerged?: boolean;
};

export function CommentEditor({
	placeholder,
	disabled = false,
	avatarLink,
	username,
	onSubmit,
	defaultValue,
	uploadUrl,
	onClose,
	onReopen,
	isClosed = false,
	isMerged = false,
}: CommentEditorProps) {
	const { t } = useTranslation();
	const [value, setValue] = useState("");
	const [tab, setTab] = useState<"write" | "preview">("write");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [closing, setClosing] = useState(false);

	useEffect(() => {
		if (defaultValue) {
			setValue(defaultValue);
			setTab("write");
			textareaRef.current?.focus();
		}
	}, [defaultValue]);

	function handleSubmit() {
		if (!value.trim() || !onSubmit) return;
		onSubmit(value);
		setValue("");
	}

	async function handleClose() {
		if (!onClose) return;
		setClosing(true);
		try {
			onClose(value);
			setValue("");
		} finally {
			setClosing(false);
		}
	}

	function insertImageMarkdown(url: string) {
		const textarea = textareaRef.current;
		if (!textarea) {
			setValue((prev) => prev + `![image](${url})`);
			return;
		}
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const before = value.slice(0, start);
		const after = value.slice(end);
		const insertion = `![image](${url})`;
		setValue(before + insertion + after);
		setTimeout(() => {
			textarea.selectionStart = textarea.selectionEnd =
				start + insertion.length;
			textarea.focus();
		}, 0);
	}

	async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file || !uploadUrl) return;

		if (!file.type.startsWith("image/")) {
			toast.error(t("pulls.conversation.editor.selectImage"));
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error(t("pulls.conversation.editor.imageTooLarge"));
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("image", file);

			const res = await fetch(uploadUrl, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			const data = await res.json();
			if (!res.ok) {
				toast.error(
					data.error || t("pulls.conversation.editor.uploadFailed"),
				);
				return;
			}

			insertImageMarkdown(data.url);
		} catch {
			toast.error(t("pulls.conversation.editor.uploadFailed"));
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	return (
		<div className="group ml-9 flex w-full flex-col gap-3">
			<div className="flex w-full flex-row gap-4">
				<Avatar className="size-9 shrink-0">
					<AvatarImage src={avatarLink} />
					<AvatarFallback>
						{username ? username.slice(0, 2).toUpperCase() : "??"}
					</AvatarFallback>
				</Avatar>

				<div className="flex w-full max-w-[890px] flex-col gap-1">
					<h1 className="text-base font-semibold">
						{t("pulls.conversation.editor.addComment")}
					</h1>
					<div className="w-full overflow-hidden rounded-lg border">
						<Tabs
							value={tab}
							onValueChange={(value) => setTab(value as "write" | "preview")}
						>
							<div className="flex items-center justify-between gap-2 border-b bg-muted/10 pr-1.5">
								<TabsList className="m-1 h-7 bg-transparent">
									<TabsTrigger value="write" className="px-2.5 text-sm">
										{t("issues.editor.write")}
									</TabsTrigger>

									<TabsTrigger value="preview" className="px-2.5 text-sm">
										{t("issues.editor.preview")}
									</TabsTrigger>
								</TabsList>

								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleFileUpload}
								/>
								<Button
									type="button"
									variant="ghost"
									disabled={disabled || uploading || !uploadUrl}
									className="text-muted-foreground"
									onClick={() => fileInputRef.current?.click()}
								>
								<ImagePlus className="size-4" />
								<span>
									{uploading
										? t("common.actions.uploading")
										: t("issues.editor.attachImage")}
								</span>
							</Button>
							</div>

							<TabsContent value="write" className="m-0 p-0">
								<Textarea
									ref={textareaRef}
									rows={6}
									className="max-h-auto resize-none rounded-none border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
									placeholder={
										placeholder ?? t("pulls.conversation.editor.placeholder")
									}
									value={value}
									onChange={(event) => setValue(event.target.value)}
									disabled={disabled}
								/>
							</TabsContent>

							<TabsContent value="preview" className="m-0 overflow-hidden">
								<div className="max-h-auto overflow-auto px-4 py-3">
									{value.trim() ? (
										<Markdown content={value} />
									) : (
										<p className="text-sm italic text-muted-foreground">
											{t("common.states.nothingToPreview")}
										</p>
									)}
								</div>
							</TabsContent>
						</Tabs>
					</div>

					<div className="flex items-center justify-end gap-2 mt-2">
						{!isClosed && !isMerged && (
							<Button
								type="button"
								variant="outline"
								disabled={closing}
								onClick={handleClose}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="text-red-500"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
								>
									<circle cx="6" cy="6" r="3" />
									<path d="M6 9v12M21 3l-6 6m6 0l-6-6m3 8.5V15" />
									<circle cx="18" cy="18" r="3" />
								</svg>

							{closing
								? t("pulls.conversation.editor.closing")
								: value.trim()
									? t("pulls.conversation.editor.closeWithComment")
									: t("pulls.conversation.editor.close")}
						</Button>
					)}
						{isClosed && !isMerged && (
							<Button
								type="button"
								variant="outline"
								disabled={closing}
								onClick={onReopen}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="text-fuchsia-600"
									width="16"
									height="16"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M22 12c0 5.523-4.477 10-10 10a9.98 9.98 0 0 1-7.781-3.719L2 20.5v-6h6l-2.357 2.357A8 8 0 0 0 20 12zm-10-2a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-8a9.98 9.98 0 0 1 7.781 3.719L22 3.5v6h-6l2.357-2.357A8 8 0 0 0 4 12H2C2 6.477 6.477 2 12 2"
									/>
								</svg>
							{t("pulls.conversation.editor.reopen")}
						</Button>
					)}
					<Button
						type="button"
						disabled={disabled || !value.trim()}
						onClick={handleSubmit}
					>
						{t("pulls.conversation.editor.comment")}
					</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function OpenedEvent({
	username,
	avatarLink,
	date,
	sourceBranch,
	targetBranch,
}: Omit<ConversationOpened, "type">) {
	const { t } = useTranslation();
	return (
		<div className="ml-13 flex flex-row items-center gap-2 text-sm">
			<div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
				>
					<line x1="6" y1="3" x2="6" y2="15" />
					<circle cx="18" cy="6" r="3" />
					<circle cx="6" cy="18" r="3" />
					<path d="M18 9a9 9 0 0 1-9 9" />
				</svg>
			</div>

			<Avatar className="size-6">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<span className="font-semibold">{username}</span>

			<span className="text-muted-foreground">
				{t("pulls.conversation.timeline.openedFrom")}{" "}
				<Badge size="sm" variant="outline">
					{sourceBranch}
				</Badge>{" "}
				{t("pulls.conversation.timeline.into")}{" "}
				<Badge size="sm" variant="outline">
					{targetBranch}
				</Badge>
			</span>

			<span className="ml-auto text-xs text-muted-foreground">
				{timeAgo(date)}
			</span>
		</div>
	);
}

export function StateChangeEvent({
	username,
	avatarLink,
	date,
	oldState: _oldState,
	newState,
}: Omit<ConversationStateChange, "type">) {
	const { t } = useTranslation();
	const isClose = newState === "closed";
	const label = isClose
		? t("pulls.state.closedLower")
		: t("pulls.state.reopened");

	return (
		<div className="ml-13 flex flex-row items-center gap-2 text-sm">
			<div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
				{isClose ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="15" y1="9" x2="9" y2="15" />
						<line x1="9" y1="9" x2="15" y2="15" />
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M22 12c0 5.523-4.477 10-10 10a9.98 9.98 0 0 1-7.781-3.719L2 20.5v-6h6l-2.357 2.357A8 8 0 0 0 20 12zm-10-2a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-8a9.98 9.98 0 0 1 7.781 3.719L22 3.5v6h-6l2.357-2.357A8 8 0 0 0 4 12H2C2 6.477 6.477 2 12 2"
						/>
					</svg>
				)}
			</div>

			<Avatar className="size-6">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<span className="font-semibold">{username}</span>

			<span className="text-muted-foreground">
				{t("pulls.conversation.timeline.stateChange", { action: label })}
			</span>

			<span className="ml-auto text-xs text-muted-foreground">
				{timeAgo(date)}
			</span>
		</div>
	);
}

export function MergedEvent({
	username,
	avatarLink,
	date,
	targetBranch,
	sourceBranch,
	onRevert,
	isReverting,
	isReverted,
}: Omit<ConversationMerged, "type">) {
	const { t } = useTranslation();
	return (
		<div className="ml-13 flex flex-row items-center gap-2 text-sm">
			<div className="flex size-7 items-center justify-center rounded-full bg-purple-700">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					className="text-white"
				>
					<circle cx="18" cy="18" r="3" />
					<circle cx="6" cy="6" r="3" />
					<path d="M6 21V9a9 9 0 0 0 9 9" />
				</svg>
			</div>

			<Avatar className="size-6">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<span className="font-semibold">{username}</span>

			<span className="text-muted-foreground">
				{t("pulls.conversation.timeline.merged")}{" "}
				<Badge size="sm" variant="outline">
					{targetBranch}
				</Badge>{" "}
				{t("pulls.conversation.timeline.into")}{" "}
				<Badge size="sm" variant="outline">
					{sourceBranch}
				</Badge>
			</span>

			<span className="ml-auto text-xs text-muted-foreground underline">
				{timeAgo(date)}
			</span>

			<Button
				variant="outline"
				size="sm"
				className="ml-1 h-7 text-xs"
				onClick={onRevert}
				disabled={isReverting || isReverted}
			>
				{isReverted
					? t("pulls.conversation.revert.revertedToast")
					: isReverting
						? t("pulls.conversation.revert.reverting")
						: t("pulls.conversation.revert.button")}
			</Button>
		</div>
	);
}

export function RevertedEvent({
	username,
	avatarLink,
	date,
	targetBranch,
	sourceBranch,
	owner,
	repo,
}: Omit<ConversationReverted, "type"> & { owner: string; repo: string }) {
	const { t } = useTranslation();
	return (
		<div className="ml-13 flex flex-row items-center gap-2 text-sm">
			<div className="flex size-7 items-center justify-center rounded-full bg-muted border border-border">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					className="text-muted-foreground"
				>
					<path
						fill="currentColor"
						d="M9 10h6c2.21 0 4 1.79 4 4s-1.79 4-4 4h-3v2h3c3.31 0 6-2.69 6-6s-2.69-6-6-6H9V4L3 9l6 5z"
					/>
				</svg>
			</div>

			<Avatar className="size-6">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<span className="font-semibold">{username}</span>

			<span className="text-muted-foreground">
				{t("pulls.conversation.revert.revivedTimeline")}
			</span>

			<span className="ml-auto text-xs text-muted-foreground underline">
				{timeAgo(date)}
			</span>

			<Button
				asChild
				variant="outline"
				size="sm"
				className="ml-1 h-7 text-xs border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-950"
			>
				<Link
					to={`/${owner}/${repo}/compare/${targetBranch}...${sourceBranch}`}
				>
					{t("pulls.conversation.revert.remerge")}
				</Link>
			</Button>
		</div>
	);
}

export function PushEvent({
	username,
	avatarLink,
	date,
	commitCount,
	commits,
}: Omit<ConversationPush, "type">) {
	const { t } = useTranslation();
	return (
		<div className="ml-13 flex flex-row items-start gap-2 text-sm">
			<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<GitCommit className="size-4" />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<Avatar className="size-6">
						<AvatarImage src={avatarLink} />
						<AvatarFallback>
							{username.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					<span className="font-semibold">{username}</span>

					<span className="text-muted-foreground">
						{t("pulls.conversation.timeline.pushedCommit", {
							count: commitCount,
						})}
					</span>

					<span className="ml-auto text-xs text-muted-foreground">
						{timeAgo(date)}
					</span>
				</div>

				{commits.length > 0 && (
					<div className="mt-1.5 rounded-md border bg-muted/30 px-3 py-2">
						{commits.map((c) => (
							<div key={c.hash} className="flex items-center gap-2 text-xs">
								<code className="font-mono text-muted-foreground">
									{c.hash.slice(0, 7)}
								</code>
								<span className="truncate">{c.message}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export function BranchDeletedEvent({
	username,
	avatarLink,
	date,
	branch,
}: Omit<ConversationBranchDeleted, "type">) {
	const { t } = useTranslation();
	return (
		<div className="ml-13 flex flex-row items-center gap-2 text-sm">
			<div className="flex size-7 items-center justify-center rounded-full bg-muted border border-border">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
				>
					<g
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
					>
						<path d="M5 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0m2 2v8m2 2h6a2 2 0 0 0 2-2v-5" />
						<path d="m14 14l3-3l3 3M15 4l4 4m-4 0l4-4" />
					</g>
				</svg>
			</div>

			<Avatar className="size-6">
				<AvatarImage src={avatarLink} />
				<AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>

			<span className="font-semibold">{username}</span>

			<span className="text-muted-foreground">
				{t("pulls.conversation.timeline.deletedThe")}
			</span>

			<code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
				{branch}
			</code>

			<span className="text-muted-foreground">
				{t("pulls.conversation.timeline.branch")}
			</span>

			<span className="ml-auto text-xs text-muted-foreground underline">
				{timeAgo(date)}
			</span>
		</div>
	);
}
