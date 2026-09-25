import { Link } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { absoluteDate, timeAgo } from "#/lib/time-ago";
import type { TagInfo } from "#/types/repo";
import { Badge } from "../../ui/badge";
import { Spinner } from "../../ui/spinner";

interface TagsListProps {
	owner: string;
	repo: string;
	tags: TagInfo[];
	isLoading: boolean;
	isError: boolean;
}

function TagRow({
	owner,
	repo,
	tag,
	isLast,
}: {
	owner: string;
	repo: string;
	tag: TagInfo;
	isLast: boolean;
}) {
	return (
		<div
			className={`flex flex-row items-center gap-4 border border-t-0 px-3 py-2 text-sm first:border-t first:rounded-t-sm transition-colors hover:bg-muted/50${isLast ? " rounded-b-sm" : ""}`}
		>
			<div className="flex w-60 shrink-0 items-center gap-2.5">
				<Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Link
					to={`/${owner}/${repo}/tag/${tag.name}`}
					className="truncate font-medium text-foreground hover:underline hover:decoration-muted-foreground/40 hover:underline-offset-2"
					title={tag.name}
				>
					{tag.name}
				</Link>
				<Badge variant="outline" className="h-4 px-1.5 text-[10px]">
					{tag.type}
				</Badge>
			</div>

			<span
				className="min-w-0 flex-1 truncate text-muted-foreground text-sm pl-20"
				title={tag.commitMessage || "No commit message"}
			>
				{tag.commitMessage || "No commit message"}
			</span>

			{tag.taggerDate ? (
				<span
					className="shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground"
					title={absoluteDate(tag.taggerDate)}
				>
					{timeAgo(tag.taggerDate)}
				</span>
			) : null}

			{tag.commit ? (
				<Link
					to={`/${owner}/${repo}/commits/${tag.commit}`}
					className="shrink-0 font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
					title={tag.commit}
				>
					{tag.shortSha}
				</Link>
			) : (
				<span
					className="shrink-0 font-mono text-xs text-muted-foreground"
					title={tag.target}
				>
					{tag.target.slice(0, 7)}
				</span>
			)}
		</div>
	);
}

export function TagsList({
	owner,
	repo,
	tags,
	isLoading,
	isError,
}: TagsListProps) {
	if (isLoading) {
		return (
			<div className="flex h-[40vh] w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-[40vh] w-full flex-col items-center justify-center gap-2 text-center">
				<p className="text-sm font-medium">Failed to load tags</p>
				<p className="text-sm text-muted-foreground">
					Something went wrong while fetching tags.
				</p>
			</div>
		);
	}

	if (tags.length === 0) {
		return (
			<div className="flex h-[40vh] w-full flex-col items-center justify-center gap-2 text-center">
				<Tag className="size-7 text-muted-foreground" />
				<p className="text-sm font-medium">No tags</p>
				<p className="text-sm text-muted-foreground">
					Tags pushed to this repository will show up here.
				</p>
			</div>
		);
	}

	return (
		<div>
			{tags.map((tag, i) => (
				<TagRow
					key={tag.name}
					owner={owner}
					repo={repo}
					tag={tag}
					isLast={i === tags.length - 1}
				/>
			))}
		</div>
	);
}
