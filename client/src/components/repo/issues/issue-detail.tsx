import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronDown, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
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
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { useRepoData } from "#/hooks/useRepoData";
import { authClient } from "#/lib/auth-client";
import { timeAgo } from "#/lib/time-ago";
import type { Issue, IssueComment, IssueUser } from "#/types/issues";

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function Markdown({ content }: { content: string }) {
	return (
		<div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] prose-headings:scroll-mt-20 prose-pre:rounded-lg prose-pre:border prose-pre:bg-accent prose-code:before:content-none prose-code:after:content-none">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeSanitize]}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}

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

	async function handleToggleState() {
		if (!issue || !currentUserID) return;

		const next = issue.state === "open" ? "closed" : "open";

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/state`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						state: next,
						userId: currentUserID,
						username: session?.user.name ?? "",
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to update issue",
				);
			}

			toast.success(`Issue ${next === "open" ? "reopened" : "closed"}`);
			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	}

	async function handleAssign(assigneeId: string | null) {
		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues/${number}/assignee`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ assigneeId }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to update assignee",
				);
			}

			await refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
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
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: currentUserID,
						username: session?.user.name ?? "",
						body,
					}),
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

	return (
		<div className="mx-40">
			<div className="pt-4">
				<Button
					variant="ghost"
					size="sm"
					className="mb-2 -ml-2 text-muted-foreground"
					onClick={() => navigate({ to: `/${username}/${repo}/issues` })}
				>
					← Back to issues
				</Button>

				<div className="flex items-center gap-3">
					<h1 className="min-w-0 truncate text-2xl font-semibold">
						{issue.title}
					</h1>
					<Badge variant={closed ? "secondary" : "default"}>
						{closed ? "Closed" : "Open"}
					</Badge>
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
				</div>

				<div className="w-64 shrink-0 space-y-5">
					<div>
						<h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Assignees
						</h3>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-full justify-between">
									{issue.assignee ? (
										<span className="flex items-center gap-2">
											<UserAvatar user={issue.assignee} />
											{issue.assignee.username}
										</span>
									) : (
										<span className="text-muted-foreground">No one</span>
									)}
									<ChevronDown />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align="start" className="w-56">
								<DropdownMenuItem
									onClick={() => handleAssign(null)}
									className={issue.assignee ? "" : "font-medium"}
								>
									{!issue.assignee && <Check size={14} />}
									Unassigned
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuLabel>Contributors</DropdownMenuLabel>
								{contributors.length === 0 ? (
									<DropdownMenuItem disabled>No contributors</DropdownMenuItem>
								) : (
									contributors.map((contributor) => (
										<DropdownMenuItem
											key={contributor.id || contributor.username}
											onClick={() => handleAssign(contributor.id || null)}
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
												{contributor.username}
												{issue.assignee?.id === contributor.id && (
													<Check size={14} className="ml-auto" />
												)}
											</span>
										</DropdownMenuItem>
									))
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div>
						<h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

					<div>
						<h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Due date
						</h3>
						<p className="text-sm text-muted-foreground">
							{issue.dueDate ? timeAgo(issue.dueDate) : "No due date"}
						</p>
					</div>

					<div>
						<h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
							{closed ? "Closed" : "Open"} by
						</h3>
						<p className="text-sm text-muted-foreground">
							{closed && issue.closedBy
								? `${issue.closedBy.username} ${timeAgo(issue.closedAt ?? issue.updatedAt)}`
								: issue.author.username}
						</p>
					</div>

					{currentUserID && (
						<Button
							variant={closed ? "outline" : "secondary"}
							className="w-full"
							onClick={handleToggleState}
						>
							{closed ? <X size={14} /> : <Check size={14} />}
							{closed ? "Reopen issue" : "Close issue"}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export default IssueDetail;
