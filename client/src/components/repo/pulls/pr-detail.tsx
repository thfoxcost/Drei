import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import {
	Copy,
	FileDiff,
	GitCommit,
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	ListChecks,
	MessageSquare,
	Pen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { usePullRequest } from "#/hooks/PRs/use-pull-request";
import { usePullRequestEvents } from "#/hooks/PRs/use-pull-request-events";
import { usePullRequestMergeability } from "#/hooks/PRs/use-pull-request-mergeability";
import { usePullRequestReviews } from "#/hooks/PRs/use-pull-request-reviews";
import { useMergePullRequest } from "#/hooks/PRs/use-merge-pull-request";
import { useDeleteSourceBranch } from "#/hooks/PRs/use-delete-source-branch";
import { useRevertMerge } from "#/hooks/PRs/use-revert-merge";
import { usePRCommits } from "#/hooks/PRs/use-pr-commits";
import { usePRChangedFiles } from "#/hooks/PRs/use-pr-changed-files";
import { authClient } from "#/lib/auth-client";
import { Badge as ReuiBadge } from "@/components/reui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Changedfiles from "./content/changed-files";
import Commits from "./content/commits";
import CommentItem, {
	BranchDeletedEvent,
	CheckAndMergeItem,
	CommentEditor,
	CommitItemMSG,
	ConversationSheet,
	MergeSuccessBanner,
	MergedEvent,
	OpenedEvent,
	ReviewEventItem,
	RevertedEvent,
	StateChangeEvent,
} from "./content/conversation";
import type {
	ConversationBranchDeleted,
	ConversationComment,
	ConversationCommit,
	ConversationItem,
	ConversationMerged,
	ConversationOpened,
	ConversationReverted,
	ConversationStateChange,
} from "./content/types/conversation";

function PRdetail({ pull }: { pull: string }) {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });
	const [activeTab, setActiveTab] = useState("conversation");
	const [quoteText, setQuoteText] = useState("");
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const currentUserID = session?.user.id;

	const number = Number(pull);

	const {
		data: pr,
		isLoading,
		isError,
	} = usePullRequest(username, repo, number);

	const { data: eventsData } = usePullRequestEvents(username, repo, number);

	const { data: reviewsData } = usePullRequestReviews(username, repo, number);

	const { data: prCommits } = usePRCommits(
		username,
		repo,
		pr?.targetBranch ?? "",
		pr?.sourceBranch ?? "",
		pr?.mergeCommitHash,
	);

	const { data: prFiles } = usePRChangedFiles(username, repo, number);

	const { data: mergeabilityData, isLoading: isCheckingMergeability } =
		usePullRequestMergeability(username, repo, number, pr?.state ?? "");

	const [mergeCheckStarted, setMergeCheckStarted] = useState(false);

	useEffect(() => {
		if (pr?.state === "open") {
			const timer = setTimeout(() => setMergeCheckStarted(true), 5000);
			return () => clearTimeout(timer);
		}
	}, [pr?.state]);
	const {
		mutate: mergePullRequest,
		isPending: isMerging,
		error: mergeError,
	} = useMergePullRequest(username, repo, number);
	const {
		mutate: deleteSourceBranch,
		isPending: isDeletingBranch,
		isSuccess: branchDeleted,
	} = useDeleteSourceBranch(username, repo, number);
	const {
		mutate: revertMerge,
		isPending: isReverting,
	 isSuccess: revertSuccess,
	} = useRevertMerge(username, repo, number);

	const justMerged = useRef(false);

	const events = eventsData?.events ?? [];
	const comments = pr?.comments ?? [];
	const reviews = reviewsData?.reviews ?? [];

	const timeline = buildTimeline();

	const stats = {
		conversation: comments.length,
		commits: prCommits?.length ?? 0,
		checks: 0,
		filesChanged: prFiles?.files?.length ?? 0,
		additions: prFiles?.diffs?.reduce((t, f) => t + f.additions, 0) ?? 0,
		deletions: prFiles?.diffs?.reduce((t, f) => t + f.deletions, 0) ?? 0,
	};

	const maxSquares = 5;
	const greenSquares = Math.min(stats.additions || 1, maxSquares);
	const redSquares = Math.min(stats.deletions || 1, maxSquares - greenSquares);
	const emptySquares = maxSquares - greenSquares - redSquares;

	async function refresh() {
		await queryClient.invalidateQueries({
			queryKey: ["pull", username, repo, number],
		});
		await queryClient.invalidateQueries({
			queryKey: ["pull-events", username, repo, number],
		});
		await queryClient.invalidateQueries({
			queryKey: ["pull-reviews", username, repo, number],
		});
	}

	async function handleAddComment(body: string) {
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}/comments`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ body }),
				},
			);
			if (!res.ok) throw new Error(t("pulls.detail.addCommentFailed"));
			toast.success(t("pulls.detail.commentAdded"));
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleEditComment(commentId: number, body: string) {
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}/comments/${commentId}`,
				{
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ body }),
				},
			);
			if (!res.ok) throw new Error(t("pulls.detail.updateCommentFailed"));
			toast.success(t("pulls.detail.commentUpdated"));
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleDeleteComment(commentId: number) {
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}/comments/${commentId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			if (!res.ok) throw new Error(t("pulls.detail.deleteCommentFailed"));
			toast.success(t("pulls.detail.commentDeleted"));
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleDeleteReview(reviewId: number) {
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}/reviews/${reviewId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			if (!res.ok) throw new Error(t("pulls.detail.deleteReviewFailed"));
			toast.success(t("pulls.detail.reviewDeleted"));
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleClose(body: string) {
		try {
			const payload: Record<string, string> = {};
			if (body.trim()) payload.body = body;

			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}/close`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || t("pulls.detail.closeFailed"));
			}
			toast.success(t("pulls.detail.closedToast"));
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleReopen() {
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}/reopen`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || t("pulls.detail.reopenFailed"));
			}
			toast.success(t("pulls.detail.reopenedToast"));
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleSaveTitle() {
		const trimmed = editTitle.trim();
		if (!trimmed || trimmed === pr.title) {
			setIsEditingTitle(false);
			return;
		}
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/pulls/${number}`,
				{
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: trimmed, description: pr.description ?? "" }),
				},
			);
			if (!res.ok) throw new Error(t("pulls.detail.updateTitleFailed"));
			toast.success(t("pulls.detail.titleUpdated"));
			setIsEditingTitle(false);
			await refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("common.errors.somethingWentWrong"),
			);
		}
	}

	function buildTimeline(): ConversationItem[] {
		const items: ConversationItem[] = [];

		for (const event of events) {
			if (event.type === "comment" || event.type === "opened") continue;

			if (event.type === "opened") {
				items.push({
					type: "opened",
					date: event.createdAt,
					username: event.actor.username,
					avatarLink: event.actor.avatar ?? undefined,
					sourceBranch: pr?.sourceBranch ?? "",
					targetBranch: pr?.targetBranch ?? "",
				} satisfies ConversationOpened);
			} else if (event.type === "state_change") {
				const oldState = (event.metadata?.old_state as string) ?? "open";
				const newState = (event.metadata?.new_state as string) ?? "closed";
				items.push({
					type: "state_change",
					date: event.createdAt,
					username: event.actor.username,
					avatarLink: event.actor.avatar ?? undefined,
					oldState,
					newState,
				} satisfies ConversationStateChange);
			} else if (event.type === "merged") {
				items.push({
					type: "merged",
					date: event.createdAt,
					username: event.actor.username,
					avatarLink: event.actor.avatar ?? undefined,
					targetBranch: pr?.targetBranch ?? "",
					sourceBranch: pr?.sourceBranch ?? "",
					onRevert: () => handleRevert(),
					isReverting,
					isReverted: revertSuccess,
				} satisfies ConversationMerged);
			} else if (event.type === "reverted") {
				items.push({
					type: "reverted",
					date: event.createdAt,
					username: event.actor.username,
					avatarLink: event.actor.avatar ?? undefined,
					targetBranch: pr?.targetBranch ?? "",
					sourceBranch: pr?.sourceBranch ?? "",
				} satisfies ConversationReverted);
			} else if (event.type === "push") {
				const commits = (event.metadata?.commits as { hash: string; message: string }[]) ?? [];
				for (const c of commits) {
					items.push({
						type: "commit",
						date: event.createdAt,
						username: event.actor.username,
						avatarLink: event.actor.avatar ?? undefined,
						message: c.message,
						hash: c.hash,
						owner: username,
						repo,
					} satisfies ConversationCommit);
				}
			} else if (event.type === "branch_deleted") {
				const branch = (event.metadata?.branch as string) ?? "";
				items.push({
					type: "branch_deleted",
					date: event.createdAt,
					username: event.actor.username,
					avatarLink: event.actor.avatar ?? undefined,
					branch,
				} satisfies ConversationBranchDeleted);
			}
		}

		for (const comment of comments) {
			items.push({
				type: "comment",
				commentId: comment.id,
				date: comment.createdAt,
				username: comment.createdBy.username,
				avatarLink: comment.createdBy.avatar ?? undefined,
				comment: comment.body,
				isAuthor: currentUserID === comment.createdBy.id,
				onEdit: handleEditComment,
				onDelete: handleDeleteComment,
				onQuoteReply: (text: string) => setQuoteText(text),
				issueBasePath: { username, repo },
			} satisfies ConversationComment);
		}

		for (const review of reviews) {
			const stateMap: Record<string, "approved" | "changes_requested" | "commented"> = {
				approved: "approved",
				changes_requested: "changes_requested",
				comment: "commented",
			};
			items.push({
				type: "review",
				reviewId: review.id,
				date: review.createdAt,
				username: review.reviewer.username,
				avatarLink: review.reviewer.avatar ?? undefined,
				state: stateMap[review.state] ?? "commented",
				body: review.body,
				isAuthor: currentUserID === review.reviewer.id,
				onDelete: handleDeleteReview,
				onQuoteReply: (text: string) => setQuoteText(text),
			} satisfies ConversationReview);
		}

		items.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		return items;
	}

	if (isLoading) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (isError || !pr) {
		return (
			<div className="flex flex-col items-center gap-2 p-10">
				<p className="text-sm text-muted-foreground">
					{t("pulls.detail.loadFailed")}
				</p>
				<Button variant="outline" onClick={() => refresh()}>
					{t("common.actions.retry")}
				</Button>
			</div>
		);
	}

	const isOpen = pr.state === "open";
	const isMerged = pr.state === "merged";

	const mergeState: "checking" | "mergeable" | "conflicted" | "merged" = (() => {
		if (isMerged || justMerged.current) return "merged";
		if (!isOpen) return "conflicted";
		if (isCheckingMergeability || !mergeCheckStarted) return "checking";
		if (mergeabilityData?.mergeable) return "mergeable";
		return "conflicted";
	})();

	function handleMerge() {
		mergePullRequest(undefined, {
			onSuccess: () => {
				justMerged.current = true;
				toast.success(t("pulls.detail.mergedToast"));
			},
			onError: (err) => {
				toast.error(err.message || t("pulls.detail.mergeFailed"));
			},
		});
	}

	function handleRevert() {
		revertMerge(undefined, {
			onSuccess: () => {
				toast.success(t("pulls.detail.revertedToast"));
			},
			onError: (err) => {
				toast.error(err.message || t("pulls.detail.revertFailed"));
			},
		});
	}

	return (
		<div className={activeTab === "changes" ? "mx-5 mb-10" : "mx-30 mb-10"}>
			<div className="pt-1">
				<h1 className="flex min-w-0 items-baseline gap-1 truncate text-3xl font-medium tracking-tight">
					{isEditingTitle ? (
						<input
							autoFocus
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSaveTitle();
								if (e.key === "Escape") setIsEditingTitle(false);
							}}
							onBlur={handleSaveTitle}
							className="min-w-0 flex-1 truncate border-b bg-transparent text-3xl font-medium tracking-tight outline-none"
						/>
					) : (
						<span className="min-w-0 truncate">{pr.title}</span>
					)}

					<span className="shrink-0 font-light text-muted-foreground">
						#{pull}
					</span>

					<div className="ml-auto flex shrink-0 items-center gap-1">
						{isOpen && mergeState === "checking" && (
							<Button variant="outline" disabled>
								<Spinner className="size-4" />
								{t("pulls.detail.checking")}
							</Button>
						)}

						{isOpen && mergeState === "mergeable" && (
							<Button
								variant="outline"
								onClick={handleMerge}
								disabled={isMerging}
							>
								<svg
									className="text-green-500"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									role="img"
									aria-label={t("pulls.detail.mergeable")}
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
								{t("pulls.detail.merge")}
							</Button>
						)}

						{isOpen && mergeState === "conflicted" && (
							<Button variant="outline">
								<svg
									className="text-red-500"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									role="img"
									aria-label={t("pulls.detail.conflicts")}
								>
									<g fill="none">
										<path
											fillRule="evenodd"
											clipRule="evenodd"
											d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m3.535 6.465a1 1 0 0 0-1.414 0L12 10.585l-2.121-2.12a1 1 0 1 0-1.414 1.414L10.585 12l-2.12 2.121a1 1 0 1 0 1.414 1.414L12 13.415l2.121 2.12a1 1 0 1 0 1.414-1.414L13.415 12l2.12-2.121a1 1 0 0 0 0-1.414"
											fill="currentColor"
										/>
									</g>
								</svg>
								{mergeabilityData?.error ?? t("pulls.detail.conflicts")}
							</Button>
						)}

						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground"
							onClick={() => {
								setEditTitle(pr.title);
								setIsEditingTitle(true);
							}}
						>
							<Pen />
						</Button>
					</div>
				</h1>

				<div className="mt-2 flex items-center gap-2">
					{isOpen && (
						<Badge
							variant="secondary"
							className="h-7 gap-1.5 bg-green-600 text-sm text-foreground"
						>
						<GitPullRequest className="size-4 shrink-0" />
						<span className="font-bold">{t("pulls.state.open")}</span>
						</Badge>
					)}

					{isMerged && (
						<Badge
							variant="secondary"
							className="h-7 gap-1.5 bg-purple-700 text-sm text-foreground"
						>
						<GitMerge className="size-4 shrink-0" />
						<span className="font-bold">{t("pulls.state.merged")}</span>
						</Badge>
					)}

					{pr.state === "closed" && !isMerged && (
						<Badge
							variant="secondary"
							className="h-7 gap-1.5 bg-red-600 text-sm text-foreground"
						>
						<GitPullRequestClosed className="size-4 shrink-0" />
						<span className="font-bold">{t("pulls.state.closed")}</span>
						</Badge>
					)}

					<span className="text-sm text-muted-foreground">
						<span className="font-semibold underline">
							{pr.author.username}
						</span>{" "}
						{isMerged
							? t("pulls.state.mergedLower")
							: t("pulls.state.wantsToMerge")}{" "}
						{t("pulls.state.into")}{" "}
						<ReuiBadge variant="save-info">{pr.targetBranch}</ReuiBadge>{" "}
						{t("pulls.state.from")}{" "}
						<ReuiBadge variant="save-info">{pr.sourceBranch}</ReuiBadge>
					</span>

					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						onClick={() => {
							navigator.clipboard.writeText(pr.sourceBranch);
							toast.success(t("pulls.detail.branchCopied"));
						}}
					>
						<Copy />
					</Button>
				</div>

				<div className="mt-6">
					<Tabs
						defaultValue="conversation"
						value={activeTab}
						onValueChange={setActiveTab}
						className="gap-4"
					>
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
								{t("pulls.detail.tabs.conversation")}
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
								{t("pulls.detail.tabs.commits")}
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
								{t("pulls.detail.tabs.checks")}
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
								{t("pulls.detail.tabs.files")}
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
									<div className="flex w-full flex-col gap-5">
										{timeline.map((item, index) => {
											if (item.type === "comment") {
												return (
													<CommentItem
														key={`comment-${item.commentId}`}
														commentId={item.commentId}
														username={item.username}
														avatarLink={item.avatarLink}
														comment={item.comment}
														date={item.date}
														isAuthor={item.isAuthor}
														onEdit={item.onEdit}
														onDelete={item.onDelete}
														onQuoteReply={item.onQuoteReply}
														issueBasePath={item.issueBasePath}
													/>
												);
											}

										if (item.type === "review") {
											return (
												<ReviewEventItem
													key={`review-${index}`}
													reviewId={item.reviewId}
													username={item.username}
													avatarLink={item.avatarLink}
													date={item.date}
													state={item.state}
													body={item.body}
													isAuthor={item.isAuthor}
													onDelete={item.onDelete}
													onQuoteReply={item.onQuoteReply}
												/>
											);
										}

											if (item.type === "commit") {
												return (
													<CommitItemMSG
														key={`commit-${index}`}
														username={item.username}
														avatarLink={item.avatarLink}
														message={item.message}
														hash={item.hash}
														date={item.date}
														owner={username}
														repo={repo}
													/>
												);
											}

											if (item.type === "opened") {
												return (
													<OpenedEvent
														key={`opened-${index}`}
														username={item.username}
														avatarLink={item.avatarLink}
														date={item.date}
														sourceBranch={item.sourceBranch}
														targetBranch={item.targetBranch}
													/>
												);
											}

											if (item.type === "state_change") {
												return (
													<StateChangeEvent
														key={`state-${index}`}
														username={item.username}
														avatarLink={item.avatarLink}
														date={item.date}
														oldState={item.oldState}
														newState={item.newState}
													/>
												);
											}

											if (item.type === "merged") {
												return (
													<MergedEvent
														key={`merged-${index}`}
														username={item.username}
														avatarLink={item.avatarLink}
														date={item.date}
														targetBranch={item.targetBranch}
														sourceBranch={item.sourceBranch}
														onRevert={item.onRevert}
														isReverting={item.isReverting}
														isReverted={item.isReverted}
													/>
												);
											}

											if (item.type === "reverted") {
												return (
													<RevertedEvent
														key={`reverted-${index}`}
														username={item.username}
														avatarLink={item.avatarLink}
														date={item.date}
														targetBranch={item.targetBranch}
														sourceBranch={item.sourceBranch}
														owner={username}
														repo={repo}
													/>
												);
											}

											if (item.type === "branch_deleted") {
												return (
													<BranchDeletedEvent
														key={`branch-deleted-${index}`}
														username={item.username}
														avatarLink={item.avatarLink}
														date={item.date}
														branch={item.branch}
													/>
												);
											}

											return null;
										})}
									</div>

									<div className="ml-9 border-y" />

									{isMerged ? (
										<MergeSuccessBanner
											sourceBranch={pr.sourceBranch}
											owner={username}
											repo={repo}
											number={number}
											onDeleteBranch={() => deleteSourceBranch()}
											isDeletingBranch={isDeletingBranch}
											branchDeleted={branchDeleted}
										/>
									) : (
										<CheckAndMergeItem
											mergeState={mergeState}
											disabled={!isOpen || isMerging}
											onMerge={handleMerge}
											isMerging={isMerging}
										/>
									)}

									{mergeError && isOpen && (
										<div className="ml-9 my-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
											{mergeError.message}
										</div>
									)}

									<div className="ml-9 border-y" />

									<CommentEditor
										avatarLink={session?.user.image ?? undefined}
										username={session?.user.name}
										onSubmit={handleAddComment}
										defaultValue={quoteText}
										uploadUrl={`http://localhost:3200/api/repos/${username}/${repo}/pulls/images`}
										onClose={handleClose}
										onReopen={handleReopen}
										isClosed={pr.state === "closed"}
										isMerged={pr.state === "merged"}
									/>
								</div>

								<ConversationSheet
									pull={pr}
									username={username}
									repo={repo}
									onUpdate={() => {
										queryClient.invalidateQueries({
											queryKey: ["pull", username, repo, number],
										});
									}}
								/>
							</div>
						</TabsContent>

						<TabsContent value="commits">
							<Commits
								owner={username}
								repo={repo}
								base={pr.targetBranch}
								head={pr.sourceBranch}
								mergeCommitHash={pr.mergeCommitHash}
							/>
						</TabsContent>

					<TabsContent value="checks">
						<p className="text-sm text-muted-foreground">
							{t("pulls.detail.checksEmpty")}
						</p>
					</TabsContent>

						<TabsContent value="changes">
							<Changedfiles owner={username} repo={repo} pullNumber={number} />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}

export default PRdetail;
