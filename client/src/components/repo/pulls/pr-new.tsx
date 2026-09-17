import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Circle, Loader2, Settings } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
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
import type { BranchCompare } from "#/hooks/PRs/use-pull-compare";
import { authClient } from "#/lib/auth-client";

interface PrNewProps {
	owner: string;
	repo: string;
	base: string;
	source: string;
	compare: BranchCompare | undefined;
	duplicatePR: { duplicate: boolean; number: number | null } | undefined;
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

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const isSameBranch = base === source;
	const isConflicting = compare && !compare.mergeable;
	const isAhead = compare && compare.ahead > 0;
	const isDuplicate = duplicatePR?.duplicate === true;
	const isDisabled =
		isSameBranch || !isAhead || isDuplicate || createPR.isPending;

	const handleCreate = () => {
		if (!title.trim() || isDisabled) return;

		createPR.mutate(
			{
				title: title.trim(),
				description,
				sourceBranch: source,
				targetBranch: base,
			},
			{
				onSuccess: (pr) => {
					navigate({
						to: `/${owner}/${repo}/pulls/${pr.number}`,
					});
				},
			},
		);
	};

	const handleCancel = () => {
		navigate({
			to: `/${owner}/${repo}/pulls`,
		});
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

			<div className="grid flex-1 grid-cols-1 items-start gap-8 md:grid-cols-[1fr_240px]">
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

					{compare && !isSameBranch && !isAhead && (
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
							disabled={createPR.isPending}
						>
							Cancel
						</Button>

						<Button
							className="bg-green-700 text-white hover:bg-green-800"
							onClick={handleCreate}
							disabled={isDisabled || !title.trim()}
						>
							{createPR.isPending && (
								<Loader2 className="mr-1.5 size-3.5 animate-spin" />
							)}
							Create pull request
						</Button>
					</div>
				</div>

				<div className="sticky top-4 self-start text-sm">
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

						<DropdownMenuContent className="w-60 p-1">
							<DropdownMenuGroup>
								<DropdownMenuLabel>Select reviewers</DropdownMenuLabel>

								<Input placeholder="Filter reviewers" />
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								<DropdownMenuItem>
									<Avatar size="sm">
										<AvatarImage
											src="https://github.com/shadcn.png"
											alt="shadcn"
										/>
										<AvatarFallback>CN</AvatarFallback>
									</Avatar>

									<span>shadcn</span>
								</DropdownMenuItem>

								<DropdownMenuItem>
									<Avatar size="sm">
										<AvatarFallback>TF</AvatarFallback>
									</Avatar>

									<span>thefoxcost</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<span className="px-2 text-xs text-muted-foreground">
						No reviewers
					</span>

					<Separator className="my-2" />

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

						<DropdownMenuContent className="w-60 p-1">
							<DropdownMenuGroup>
								<DropdownMenuLabel>Select assignees</DropdownMenuLabel>

								<Input placeholder="Filter assignees" />
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								<DropdownMenuItem>
									<Avatar size="sm">
										<AvatarImage
											src="https://github.com/shadcn.png"
											alt="shadcn"
										/>
										<AvatarFallback>CN</AvatarFallback>
									</Avatar>

									<span>shadcn</span>
								</DropdownMenuItem>

								<DropdownMenuItem>
									<Avatar size="sm">
										<AvatarFallback>TF</AvatarFallback>
									</Avatar>

									<span>thefoxcost</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<span className="px-2 text-xs text-muted-foreground">
						No one assigned
					</span>

					<Separator className="my-2" />

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
								<DropdownMenuLabel>Select labels</DropdownMenuLabel>

								<Input placeholder="Filter labels" className="h-8" />
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								<DropdownMenuItem>
									<Circle className="size-3 fill-red-500 text-red-500" />
									<span>bug</span>
								</DropdownMenuItem>

								<DropdownMenuItem>
									<Circle className="size-3 fill-cyan-500 text-cyan-500" />
									<span>enhancement</span>
								</DropdownMenuItem>

								<DropdownMenuItem>
									<Circle className="size-3 fill-blue-500 text-blue-500" />
									<span>documentation</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<span className="px-2 text-xs text-muted-foreground">No labels</span>
				</div>
			</div>
		</div>
	);
}

export default PrNew;
