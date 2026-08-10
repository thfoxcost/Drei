import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { authClient } from "#/lib/auth-client";
import { Circle, Settings, X } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

type IssueLabel = {
	id: string;
	text: string;
};

const labelStyles: Record<string, string> = {
	bug: "border-red-500/70 bg-red-500/10 text-red-400",
	documentation: "border-blue-500/70 bg-blue-500/10 text-blue-400",
	duplicate: "border-gray-500/70 bg-gray-500/10 text-gray-400",
	enhancement: "border-cyan-500/70 bg-cyan-500/10 text-cyan-400",
	"good first issue":
		"border-violet-500/70 bg-violet-500/10 text-violet-400",
	question: "border-pink-500/70 bg-pink-500/10 text-pink-400",
	invalid: "border-yellow-500/70 bg-yellow-500/10 text-yellow-400",
};

const labelOptions = [
	{
		name: "bug",
		description: "Something isn't working correctly",
		dot: "fill-red-500 text-red-500",
	},
	{
		name: "documentation",
		description: "Documentation improvements or updates",
		dot: "fill-blue-500 text-blue-500",
	},
	{
		name: "duplicate",
		description: "This issue already exists",
		dot: "fill-gray-400 text-gray-400",
	},
	{
		name: "enhancement",
		description: "A new feature or improvement",
		dot: "fill-cyan-500 text-cyan-500",
	},
	{
		name: "good first issue",
		description: "Good for new contributors",
		dot: "fill-violet-500 text-violet-500",
	},
	{
		name: "question",
		description: "Further information is needed",
		dot: "fill-pink-500 text-pink-500",
	},
	{
		name: "invalid",
		description: "This issue doesn't seem valid",
		dot: "fill-yellow-500 text-yellow-500",
	},
];

function NewIssue() {
	const { username, repo } = useParams({ strict: false });
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const [labels, setLabels] = useState<IssueLabel[]>([]);

	const canSubmit = title.trim() !== "" && !submitting;

	function addLabel(labelName: string) {
		if (labels.some((label) => label.text === labelName)) {
			return;
		}

		setLabels([
			...labels,
			{
				id: crypto.randomUUID(),
				text: labelName,
			},
		]);
	}

	function removeLabel(labelId: string) {
		setLabels(labels.filter((label) => label.id !== labelId));
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		setSubmitting(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId: session?.user.id ?? "",
						username: session?.user.name ?? "",
						title: title.trim(),
						description,
						labels: labels
							.map((label) => label.text)
							.filter(Boolean),
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						"Failed to create issue",
				);
			}

			toast.success(`Issue #${result.number} created`);

			navigate({
				to: `/${username}/${repo}/issues/${result.number}`,
			});
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Something went wrong",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="ml-35 my-3 max-w-6xl">
			{/* Header */}
			<div className="flex items-center gap-2">
				<Avatar>
					<AvatarImage
						src="https://github.com/shadcn.png"
						alt="@shadcn"
					/>
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>

				<span className="font-semibold">
					Create new issue
				</span>
			</div>

			<div className="mt-4 grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_240px]">
				{/* Main form */}
				<div className="space-y-4">
					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="issue-title">
							Add a title
							<span className="text-destructive">*</span>
						</Label>

						<Input
							id="issue-title"
							type="text"
							placeholder="Issue title"
							maxLength={200}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={submitting}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="issue-description">
							Add a description
						</Label>

						<Textarea
							id="issue-description"
							rows={8}
							className="h-[420px]"
							placeholder="Type your description here..."
							value={description}
							onChange={(e) =>
								setDescription(e.target.value)
							}
							disabled={submitting}
						/>
					</div>

					{/* Buttons */}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() =>
								navigate({
									to: `/${username}/${repo}/issues`,
								})
							}
						>
							Cancel
						</Button>

						<Button
							className="bg-green-700 text-white hover:bg-green-800"
							onClick={handleSubmit}
							disabled={!canSubmit}
						>
							{submitting ? (
								<>
									<Spinner />
									<span className="ml-2">
										Creating...
									</span>
								</>
							) : (
								"Create issue"
							)}
						</Button>
					</div>
				</div>

				{/* Right sidebar */}
				<div className="sticky top-4 self-start text-sm">
					{/* Assignees */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="flex w-full items-center justify-between px-2 text-muted-foreground"
							>
								<span className="text-xs font-bold">
									Assignees
								</span>

								<Settings className="size-4" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-60 p-1">
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									Select Assignees
								</DropdownMenuLabel>

								<Input placeholder="Filter assignees" />
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								<DropdownMenuItem className="cursor-pointer">
									<Avatar size="sm">
										<AvatarImage
											src="https://github.com/shadcn.png"
											alt="@shadcn"
										/>

										<AvatarFallback>
											CN
										</AvatarFallback>
									</Avatar>

									<span>
										thefoxost{" "}
										<span className="text-xs text-muted-foreground">
											(thefoxcost)
										</span>
									</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Selected assignees */}
					<div className="mt-1">
						<Button
							variant="ghost"
							className="w-full justify-start text-xs"
						>
							<Avatar size="sm">
								<AvatarImage
									src="https://github.com/shadcn.png"
									alt="@thefoxcost"
								/>
								<AvatarFallback>TF</AvatarFallback>
							</Avatar>

							<span>thefoxcost</span>
						</Button>

						<Button
							variant="ghost"
							className="w-full justify-start text-xs"
						>
							<Avatar size="sm">
								<AvatarImage
									src="https://raw.githubusercontent.com/cedev-1/jellyfin-avatars/main/dp/dp-101.png"
									alt="@james"
								/>
								<AvatarFallback>JK</AvatarFallback>
							</Avatar>

							<span>James Karl</span>
						</Button>
					</div>

					<Separator className="my-2" />

					{/* Labels */}
					<div className="space-y-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="flex w-full items-center justify-between px-2 text-muted-foreground"
								>
									<span className="text-xs font-bold">
										Labels
									</span>

									<Settings className="size-4" />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent className="w-72 p-1">
								<DropdownMenuGroup>
									<DropdownMenuLabel className="px-2 py-1.5">
										Select labels
									</DropdownMenuLabel>

									<Input
										placeholder="Filter labels"
										className="h-8"
									/>
								</DropdownMenuGroup>

								<DropdownMenuSeparator className="my-1" />

								<DropdownMenuGroup>
									{labelOptions.map(
										(label, index) => (
											<div key={label.name}>
												<DropdownMenuItem
													className="cursor-pointer flex-col items-start gap-0.5 px-2 py-1.5"
													onClick={() =>
														addLabel(
															label.name,
														)
													}
												>
													<div className="flex items-center gap-2">
														<Circle
															className={`size-3 ${label.dot}`}
														/>

														<span className="text-xs">
															{
																label.name
															}
														</span>
													</div>

													<span className="pl-5 text-[11px] leading-tight text-muted-foreground">
														{
															label.description
														}
													</span>
												</DropdownMenuItem>

												{index <
													labelOptions.length -
														1 && (
													<DropdownMenuSeparator className="my-0.5" />
												)}
											</div>
										),
									)}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Selected labels */}
						{labels.length === 0 ? (
							<span className="px-2 text-xs text-muted-foreground">
								No labels
							</span>
						) : (
							<div className="flex flex-wrap gap-1.5 px-2">
								{labels.map((label) => (
									<Badge
										key={label.id}
										variant="outline"
										className={`gap-1 px-2 py-0.5 text-xs ${
											labelStyles[
												label.text
											] ??
											"border-border bg-muted/30 text-foreground"
										}`}
									>
										{label.text}

										<button
											type="button"
											className="ml-0.5 rounded-sm opacity-60 transition-opacity hover:opacity-100"
											onClick={() =>
												removeLabel(
													label.id,
												)
											}
										>
											<X className="size-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default NewIssue;