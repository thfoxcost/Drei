import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
	Check,
	ChevronDown,
	CircleCheck,
	CircleDot,
	CircleSlash,
	Copy,
	Pencil,
	RotateCcwClock,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { Markdown } from "#/components/repo/issues/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
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
import { Textarea } from "#/components/ui/textarea";
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard";
import { useRepoData } from "#/hooks/useRepoData";
import { authClient } from "#/lib/auth-client";
import { timeAgo } from "#/lib/time-ago";
import type { Issue, IssueComment, IssueUser } from "#/types/issues";

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

const closeReasons = [
	{
		value: "completed",
		label: "Close as completed",
		description: "This issue has been completed and resolved.",
		icon: CircleCheck,
	},
	{
		value: "not_planned",
		label: "Close as not planned",
		description: "This issue will not be worked on or completed.",
		icon: CircleSlash,
	},
	{
		value: "duplicated",
		label: "Close as duplicated",
		description: "This issue is a duplicate of another issue.",
		icon: CircleSlash,
	},
];

function UserAvatar({ user }: { user: IssueUser }) {
	return (
		<Avatar size="sm">
			{user.avatar ? (
				<AvatarImage src={user.avatar} alt={user.username} />
			) : null}
			<AvatarFallback>{getInitials(user.username)}</AvatarFallback>
		</Avatar>
	);
}

function IssueDetail() {
	const { username, repo, issue: issueParam } = useParams({ strict: false });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const { data: repoData } = useRepoData(username, repo);
	const { copyToClipboard } = useCopyToClipboard();

	const number = Number(issueParam);
	const contributors = repoData?.contributors ?? [];
	const currentUserID = session?.user.id;

	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [labels, setLabels] = useState("");
	const [saving, setSaving] = useState(false);

	const [commentBody, setCommentBody] = useState("");
	const [postingComment, setPostingComment] = useState(false);
	const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
	const [editBody, setEditBody] = useState("");
	const [busyCommentId, setBusyCommentId] = useState<number | null>(null);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const {
		data: issue,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["issue", username, repo, number],
		queryFn: async (): Promise<Issue> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}`,
			);
			if (!res.ok) throw new Error("Failed to fetch issue");
			return res.json();
		},
	});

	useEffect(() => {
		if (issue) {
			setTitle(issue.title);
			setDescription(issue.description);
			setLabels(issue.labels.join(", "));
		}
	}, [issue]);

	async function refresh() {
		await queryClient.invalidateQueries({
			queryKey: ["issue", username, repo, number],
		});
		await queryClient.invalidateQueries({
			queryKey: ["issues", username, repo],
		});
	}

	async function handleClose(reason: string) {
		if (!issue || !currentUserID) return;

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/state`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ state: "closed", reason }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to close issue",
				);
			}

			toast.success("Issue closed");
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	}

	async function handleReopen() {
		if (!issue || !currentUserID) return;

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/state`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ state: "open" }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to reopen issue",
				);
			}

			toast.success("Issue reopened");
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	}

	async function handleCopyTitle() {
		if (!issue) return;

		const copied = await copyToClipboard(issue.title);
		if (copied) toast.success("Title copied");
	}

	async function handleDelete() {
		if (!issue) return;
		setDeleting(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to delete issue",
				);
			}

			toast.success("Issue deleted");
			setDeleteOpen(false);
			queryClient.removeQueries({
				queryKey: ["issue", username, repo, number],
			});
			await queryClient.invalidateQueries({
				queryKey: ["issues", username, repo],
			});
			navigate({ to: `/${username}/${repo}/issues` });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
			setDeleting(false);
		}
	}

	async function handleSetAssignees(assignees: IssueUser[]) {
		if (!issue) return;

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/assignee`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						assignees: assignees.map((assignee) => assignee.id),
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to update assignees",
				);
			}

			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	}

	function handleToggleAssignee(contributor: Contributor) {
		if (!issue) return;

		const isAssigned = issue.assignees.some(
			(assignee) => assignee.id === contributor.id,
		);

		const next = isAssigned
			? issue.assignees.filter((assignee) => assignee.id !== contributor.id)
			: [
					...issue.assignees,
					{
						id: contributor.id,
						username: contributor.username,
						avatar: contributor.avatar,
					},
				];

		handleSetAssignees(next);
	}

	async function handleSaveEdit() {
		if (!issue) return;
		setSaving(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: title.trim(),
						description,
						labels: labels
							.split(",")
							.map((label) => label.trim())
							.filter(Boolean),
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to update issue",
				);
			}

			toast.success("Issue updated");
			setEditing(false);
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setSaving(false);
		}
	}

	async function handleAddComment() {
		const body = commentBody.trim();
		if (!body || !currentUserID || postingComment) return;
		setPostingComment(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/comments`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ body }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to add comment",
				);
			}

			setCommentBody("");
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setPostingComment(false);
		}
	}

	async function handleUpdateComment(comment: IssueComment) {
		const body = editBody.trim();
		if (!body) return;
		setBusyCommentId(comment.id);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/comments/${comment.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ body }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to update comment",
				);
			}

			setEditingCommentId(null);
			setEditBody("");
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setBusyCommentId(null);
		}
	}

	async function handleDeleteComment(comment: IssueComment) {
		setBusyCommentId(comment.id);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/comments/${comment.id}`,
				{ method: "DELETE" },
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to delete comment",
				);
			}

			toast.success("Comment deleted");
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setBusyCommentId(null);
		}
	}

	if (isLoading) {
		return (
			<div className="flex h-[50vh] w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (isError || !issue) {
		return (
			<div className="mx-40 py-16 text-center">
				<p className="text-muted-foreground">Failed to load issue.</p>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => navigate({ to: `/${username}/${repo}/issues` })}
				>
					Back to issues
				</Button>
			</div>
		);
	}

	const closed = issue.state === "closed";
	const isAuthor = currentUserID === issue.author.id;
	const canDelete = isAuthor || currentUserID === repoData?.ownerId;

	return (
		<div className="mx-40 mb-10">
			<div className="pt-4">
				<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="-ml-2 text-muted-foreground"
						onClick={() => navigate({ to: `/${username}/${repo}/issues` })}
					>
						← Back to issues
					</Button>

					<div className="flex items-center gap-2">
						<Button
							variant="default"
							onClick={() =>
								navigate({ to: `/${username}/${repo}/issues/new` })
							}
						>
							New issue
						</Button>
						<Button variant="ghost" onClick={handleCopyTitle}>
							<Copy className="size-4" />
						</Button>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<h1 className="min-w-0 truncate text-3xl font-bold">{issue.title}</h1>

					{closed ? (
						issue.closeReason === "not_planned" ||
						issue.closeReason === "duplicated" ? (
							<Badge
								variant="secondary"
								className="h-7 gap-1.5 bg-neutral-500 text-sm"
							>
								<CircleSlash className="size-4 shrink-0" />
								{issue.closeReason === "not_planned"
									? "Closed as not planned"
									: "Closed as duplicate"}
							</Badge>
						) : (
							<Badge
								className="h-7 gap-1.5 bg-purple-600 text-sm"
								variant="outline"
							>
								<CircleCheck className="size-4 shrink-0" />
								Closed
							</Badge>
						)
					) : (
						<Badge
							className="h-7 gap-1.5 bg-green-600 text-sm"
							variant="outline"
						>
							<CircleDot className="size-4 shrink-0" />
							Open
						</Badge>
					)}
				</div>

				<p className="mt-1 text-sm text-muted-foreground">
					#{issue.number} · {issue.author.username} opened{" "}
					{timeAgo(issue.createdAt)}
					{issue.updatedAt !== issue.createdAt &&
						` · updated ${timeAgo(issue.updatedAt)}`}
				</p>
			</div>

			<div className="mt-6 flex gap-6">
				<div className="min-w-0 flex-1 space-y-4">
					<div className="rounded-lg border">
						<div className="flex items-center gap-2 border-b px-4 py-2">
							<UserAvatar user={issue.author} />
							<span className="text-sm font-medium">
								{issue.author.username}
							</span>
							<span className="text-xs text-muted-foreground">
								{closed ? "closed" : "opened"} {timeAgo(issue.createdAt)}
							</span>
						</div>

						<div className="px-4 py-4">
							{editing ? (
								<div className="space-y-3">
									<Input
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Issue title"
									/>
									<Textarea
										rows={6}
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Issue description"
									/>
									<Input
										value={labels}
										onChange={(e) => setLabels(e.target.value)}
										placeholder="Labels (comma separated)"
									/>
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => {
												setEditing(false);
												if (issue) {
													setTitle(issue.title);
													setDescription(issue.description);
													setLabels(issue.labels.join(", "));
												}
											}}
											disabled={saving}
										>
											Cancel
										</Button>
										<Button
											onClick={handleSaveEdit}
											disabled={saving || title.trim() === ""}
										>
											{saving ? <Spinner /> : "Save"}
										</Button>
									</div>
								</div>
							) : (
								<>
									{issue.description ? (
										<Markdown content={issue.description} />
									) : (
										<p className="italic text-muted-foreground">
											No description provided.
										</p>
									)}

									{isAuthor && (
										<Button
											variant="ghost"
											size="sm"
											className="mt-4"
											onClick={() => setEditing(true)}
										>
											<Pencil size={14} />
											Edit
										</Button>
									)}
								</>
							)}
						</div>
					</div>

					<div className="space-y-3">
						<h2 className="text-lg font-semibold">
							Comments{" "}
							<span className="text-muted-foreground">
								({issue.commentCount})
							</span>
						</h2>

						{issue.comments?.map((comment) => {
							const isMine = currentUserID === comment.createdBy.id;

							return (
								<div key={comment.id} className="rounded-lg border">
									<div className="flex items-center justify-between gap-2 border-b px-4 py-2">
										<div className="flex items-center gap-2">
											<UserAvatar user={comment.createdBy} />
											<span className="text-sm font-medium">
												{comment.createdBy.username}
											</span>
											<span className="text-xs text-muted-foreground">
												commented {timeAgo(comment.createdAt)}
											</span>
										</div>

										{isMine && !editingCommentId && (
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label="Edit comment"
													onClick={() => {
														setEditingCommentId(comment.id);
														setEditBody(comment.body);
													}}
												>
													<Pencil size={14} />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label="Delete comment"
													disabled={busyCommentId === comment.id}
													onClick={() => handleDeleteComment(comment)}
												>
													{busyCommentId === comment.id ? (
														<Spinner />
													) : (
														<Trash2 size={14} />
													)}
												</Button>
											</div>
										)}
									</div>

									<div className="px-4 py-3">
										{editingCommentId === comment.id ? (
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
														onClick={() => {
															setEditingCommentId(null);
															setEditBody("");
														}}
														disabled={busyCommentId === comment.id}
													>
														Cancel
													</Button>
													<Button
														size="sm"
														onClick={() => handleUpdateComment(comment)}
														disabled={
															busyCommentId === comment.id ||
															editBody.trim() === ""
														}
													>
														{busyCommentId === comment.id ? (
															<Spinner />
														) : (
															"Save"
														)}
													</Button>
												</div>
											</div>
										) : (
											<Markdown content={comment.body} />
										)}
									</div>
								</div>
							);
						})}

						{currentUserID ? (
							<div className="rounded-lg border">
								<div className="border-b px-4 py-2 text-xs text-muted-foreground">
									Add a comment
								</div>
								<div className="space-y-2 px-4 py-3">
									<Textarea
										rows={4}
										placeholder="Leave a comment"
										value={commentBody}
										onChange={(e) => setCommentBody(e.target.value)}
									/>
									<div className="flex justify-end">
										<Button
											onClick={handleAddComment}
											disabled={commentBody.trim() === "" || postingComment}
										>
											{postingComment ? <Spinner /> : "Comment"}
										</Button>
									</div>
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								Sign in to comment.
							</p>
						)}
					</div>

					{currentUserID && (
						<div className="flex justify-end gap-2">
							{closed ? (
								<Button variant="outline" onClick={handleReopen}>
									<RotateCcwClock size={14} />
									Reopen issue
								</Button>
							) : (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline">
											<Check size={14} />
											Close issue
											<ChevronDown />
										</Button>
									</DropdownMenuTrigger>

									<DropdownMenuContent align="start" className="w-80">
										{closeReasons.map((reason) => {
											const ReasonIcon = reason.icon;

											return (
												<DropdownMenuItem
													key={reason.value}
													onClick={() => handleClose(reason.value)}
												>
													<ReasonIcon
														className={
															reason.value === "completed"
																? "mt-0.5 self-start size-4 shrink-0 text-purple-600"
																: "mt-0.5 self-start size-4 shrink-0"
														}
													/>
													<span className="flex flex-col gap-0.5">
														<span
															className={
																reason.value === "completed" ? "" : undefined
															}
														>
															{reason.label}
														</span>
														<span className="whitespace-nowrap text-xs text-muted-foreground">
															{reason.description}
														</span>
													</span>
												</DropdownMenuItem>
											);
										})}
									</DropdownMenuContent>
								</DropdownMenu>
							)}

							{canDelete && (
								<Button
									variant="destructive"
									onClick={() => setDeleteOpen(true)}
								>
									<Trash2 size={14} />
									Delete issue
								</Button>
							)}
						</div>
					)}
				</div>

				<div className="w-64 shrink-0 space-y-2">
					<div>
						<h3 className="mb-1.5 text-xs font-medium tracking-wider text-muted-foreground">
							Assignees
						</h3>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-full justify-between">
									{issue.assignees.length > 0 ? (
										<span className="flex items-center gap-2">
											<UserAvatar user={issue.assignees[0]} />
											{issue.assignees.length === 1
												? issue.assignees[0].username
												: `${issue.assignees[0].username} +${issue.assignees.length - 1}`}
										</span>
									) : (
										<span className="text-muted-foreground">No one</span>
									)}
									<ChevronDown />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align="start" className="w-56">
								<DropdownMenuItem
									onClick={() => handleSetAssignees([])}
									disabled={issue.assignees.length === 0}
								>
									{issue.assignees.length === 0 && <Check size={14} />}
									Unassigned
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuLabel>Contributors</DropdownMenuLabel>
								{contributors.length === 0 ? (
									<DropdownMenuItem disabled>No contributors</DropdownMenuItem>
								) : (
									contributors.map((contributor) => {
										const isAssigned = issue.assignees.some(
											(assignee) => assignee.id === contributor.id,
										);

										return (
											<DropdownMenuItem
												key={contributor.id || contributor.username}
												onClick={() => handleToggleAssignee(contributor)}
											>
												<span className="flex items-center gap-2">
													<Avatar size="sm">
														{contributor.avatar ? (
															<AvatarImage
																src={contributor.avatar}
																alt={contributor.username}
																sizes="sm"
															/>
														) : null}
														<AvatarFallback>
															{getInitials(contributor.username)}
														</AvatarFallback>
													</Avatar>
													{contributor.username}
													{isAssigned && (
														<Check size={14} className="ml-auto" />
													)}
												</span>
											</DropdownMenuItem>
										);
									})
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<Separator />
					<div>
						<h3 className="mb-1.5 text-xs font-medium tracking-wider text-muted-foreground">
							Labels
						</h3>
						<div className="flex flex-wrap gap-1.5">
							{issue.labels.length > 0 ? (
								issue.labels.map((label) => (
									<span
										key={label}
										className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
									>
										{label}
									</span>
								))
							) : (
								<span className="text-sm text-muted-foreground">None</span>
							)}
						</div>
					</div>
				</div>
			</div>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete issue #{issue.number}?</DialogTitle>
						<DialogDescription>
							This action cannot be undone. This will permanently delete issue #
							{issue.number} and all of its comments.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteOpen(false)}
							disabled={deleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={deleting}
							onClick={handleDelete}
						>
							{deleting ? <Spinner /> : "Delete issue"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default IssueDetail;
