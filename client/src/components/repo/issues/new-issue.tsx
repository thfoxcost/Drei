import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, Circle, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { MarkdownEditor } from "#/components/repo/issues/markdown-editor";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
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
import { Spinner } from "#/components/ui/spinner";
import { useRepoData } from "#/hooks/useRepoData";
import { authClient } from "#/lib/auth-client";

type IssueLabel = {
	id: string;
	text: string;
};

type LabelOption = {
	name: string;
	descriptionKey: string;
	dot: string;
};

const labelStyles: Record<string, string> = {
	bug: "border-red-500/70 bg-red-500/10 text-red-400",
	documentation: "border-blue-500/70 bg-blue-500/10 text-blue-400",
	duplicate: "border-gray-500/70 bg-gray-500/10 text-gray-400",
	enhancement: "border-cyan-500/70 bg-cyan-500/10 text-cyan-400",
	"good first issue": "border-violet-500/70 bg-violet-500/10 text-violet-400",
	question: "border-pink-500/70 bg-pink-500/10 text-pink-400",
	invalid: "border-yellow-500/70 bg-yellow-500/10 text-yellow-400",
};

const labelOptions: LabelOption[] = [
	{
		name: "bug",
		descriptionKey: "issues.labelPresets.bug",
		dot: "fill-red-500 text-red-500",
	},
	{
		name: "documentation",
		descriptionKey: "issues.labelPresets.documentation",
		dot: "fill-blue-500 text-blue-500",
	},
	{
		name: "duplicate",
		descriptionKey: "issues.labelPresets.duplicate",
		dot: "fill-gray-400 text-gray-400",
	},
	{
		name: "enhancement",
		descriptionKey: "issues.labelPresets.enhancement",
		dot: "fill-cyan-500 text-cyan-500",
	},
	{
		name: "good first issue",
		descriptionKey: "issues.labelPresets.goodFirstIssue",
		dot: "fill-violet-500 text-violet-500",
	},
	{
		name: "question",
		descriptionKey: "issues.labelPresets.question",
		dot: "fill-pink-500 text-pink-500",
	},
	{
		name: "invalid",
		descriptionKey: "issues.labelPresets.invalid",
		dot: "fill-yellow-500 text-yellow-500",
	},
];

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function NewIssue() {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const { data: repoData } = useRepoData(username, repo);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const [labels, setLabels] = useState<IssueLabel[]>([]);
	const [assignees, setAssignees] = useState<Contributor[]>([]);

	const [labelQuery, setLabelQuery] = useState("");
	const [assigneeQuery, setAssigneeQuery] = useState("");

	const canSubmit = title.trim() !== "" && !submitting;

	const contributors = repoData?.contributors ?? [];

	// Labels defined on the repository take priority over the defaults, so
	// selecting a label reuses the existing repository label instead of
	// creating a duplicate.
	const { data: repoLabels } = useQuery({
		queryKey: ["repo-labels", username, repo],
		queryFn: async (): Promise<{ name: string; color: string | null }[]> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/labels`,
			);
			if (!res.ok) throw new Error(t("issues.labels.fetchFailed"));
			const json = (await res.json()) as {
				labels?: { name: string; color: string | null }[];
			};
			return json.labels ?? [];
		},
	});

	const availableLabels = useMemo(() => {
		const existing = repoLabels ?? [];
		const existingNames = new Set(
			existing.map((label) => label.name.toLowerCase()),
		);

		// Repository labels come first so picking one reuses the existing
		// repository label (matched case-insensitively by the backend).
		const fromRepo = existing.map((label) => {
			const option = labelOptions.find(
				(o) => o.name.toLowerCase() === label.name.toLowerCase(),
			);

			return {
				name: label.name,
				descriptionKey: option?.descriptionKey ?? "issues.labels.defaultLabel",
				dot: option?.dot ?? "fill-gray-400 text-gray-400",
			};
		});

		const defaults = labelOptions.filter(
			(option) => !existingNames.has(option.name.toLowerCase()),
		);

		return [...fromRepo, ...defaults];
	}, [repoLabels]);

	const filteredLabels = useMemo(() => {
		const query = labelQuery.trim().toLowerCase();
		if (!query) return availableLabels;
		return availableLabels.filter((label) =>
			label.name.toLowerCase().includes(query),
		);
	}, [availableLabels, labelQuery]);

	const filteredContributors = useMemo(() => {
		const query = assigneeQuery.trim().toLowerCase();
		if (!query) return contributors;
		return contributors.filter((contributor) =>
			contributor.username.toLowerCase().includes(query),
		);
	}, [contributors, assigneeQuery]);

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

	function toggleAssignee(contributor: Contributor) {
		setAssignees((prev) =>
			prev.some((assignee) => assignee.id === contributor.id)
				? prev.filter((assignee) => assignee.id !== contributor.id)
				: [...prev, contributor],
		);
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		if (!session?.user.id) {
			toast.error(t("issues.new.signInRequired"));
			return;
		}

		setSubmitting(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues`,
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: title.trim(),
						description,
						labels: labels.map((label) => label.text).filter(Boolean),
						assignees: assignees.map((assignee) => assignee.id),
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || t("issues.new.createFailed"),
				);
			}

			toast.success(t("issues.new.createdToast", { number: result.number }));

			navigate({
				to: `/${username}/${repo}/issues/${result.number}`,
			});
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="ml-35 my-7 max-w-7xl">
			<div className="flex items-center gap-2">
				<Avatar>
					{session?.user.image ? (
						<AvatarImage
							src={session.user.image}
							alt={session.user.name ?? "User"}
						/>
					) : null}
					<AvatarFallback>
						{session?.user.name ? getInitials(session.user.name) : "U"}
					</AvatarFallback>
				</Avatar>

				<span className="font-semibold">{t("issues.new.heading")}</span>
			</div>

			<div className="mt-4 grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_240px] mx-10">
				{/* Main form */}
				<div className="space-y-4">
					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="issue-title">
							{t("issues.new.titleLabel")}
							<span className="text-destructive">*</span>
						</Label>

						<Input
							id="issue-title"
							type="text"
							placeholder={t("issues.new.titlePlaceholder")}
							maxLength={200}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={submitting}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="issue-description">
							{t("issues.new.descriptionLabel")}
						</Label>

						<MarkdownEditor
							id="issue-description"
							uploadUrl={`http://localhost:3200/api/repos/${username}/${repo}/issues/images`}
							placeholder={t("issues.new.descriptionPlaceholder")}
							value={description}
							onChange={setDescription}
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
							{t("common.actions.cancel")}
						</Button>

						<Button
							className="bg-green-700 text-white hover:bg-green-800"
							onClick={handleSubmit}
							disabled={!canSubmit}
						>
							{submitting ? (
								<>
									<Spinner />
									<span className="ml-2">{t("issues.new.creating")}</span>
								</>
							) : (
								t("issues.new.create")
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
									{t("issues.new.assignees")}
								</span>

								<Settings className="size-4" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-60 p-1">
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									{t("issues.new.selectAssignees")}
								</DropdownMenuLabel>

								<Input
									placeholder={t("issues.new.filterAssignees")}
									value={assigneeQuery}
									onChange={(e) => setAssigneeQuery(e.target.value)}
								/>
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuGroup>
								{filteredContributors.length === 0 ? (
									<DropdownMenuItem disabled>
										{t("issues.filters.noContributors")}
									</DropdownMenuItem>
								) : (
									filteredContributors.map((contributor) => (
										<DropdownMenuItem
											key={contributor.id || contributor.username}
											className="cursor-pointer"
											onClick={() => toggleAssignee(contributor)}
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

												<span>{contributor.username}</span>

												{assignees.some(
													(assignee) => assignee.id === contributor.id,
												) && <Check size={14} className="ml-auto" />}
											</span>
										</DropdownMenuItem>
									))
								)}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Selected assignees */}
					<div className="mt-1">
						{assignees.length === 0 ? (
							<span className="px-2 text-xs text-muted-foreground">
								{t("issues.new.noOneAssigned")}
							</span>
						) : (
							assignees.map((assignee) => (
								<Button
									key={assignee.id}
									variant="ghost"
									className="w-full justify-between text-xs"
									title={t("issues.new.removeAssignee")}
									onClick={() => toggleAssignee(assignee)}
								>
									<span className="flex items-center gap-2">
										<Avatar size="sm">
											{assignee.avatar ? (
												<AvatarImage
													src={assignee.avatar}
													alt={assignee.username}
												/>
											) : null}
											<AvatarFallback>
												{getInitials(assignee.username)}
											</AvatarFallback>
										</Avatar>

										<span>{assignee.username}</span>
									</span>

									<X className="size-3 opacity-60 transition-opacity hover:opacity-100" />
								</Button>
							))
						)}
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
										{t("issues.new.labels")}
									</span>

									<Settings className="size-4" />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent className="w-72 p-1">
								<DropdownMenuGroup>
									<DropdownMenuLabel className="px-2 py-1.5">
										{t("issues.new.selectLabels")}
									</DropdownMenuLabel>

									<Input
										placeholder={t("issues.new.filterLabels")}
										className="h-8"
										value={labelQuery}
										onChange={(e) => setLabelQuery(e.target.value)}
									/>
								</DropdownMenuGroup>

								<DropdownMenuSeparator className="my-1" />

								<DropdownMenuGroup>
									{filteredLabels.map((label, index) => (
										<div key={label.name}>
											<DropdownMenuItem
												className="cursor-pointer flex-col items-start gap-0.5 px-2 py-1.5"
												onClick={() => addLabel(label.name)}
											>
												<div className="flex items-center gap-2">
													<Circle className={`size-3 ${label.dot}`} />

													<span className="text-xs">{label.name}</span>
												</div>

												<span className="pl-5 text-[11px] leading-tight text-muted-foreground">
													{t(label.descriptionKey)}
												</span>
											</DropdownMenuItem>

											{index < filteredLabels.length - 1 && (
												<DropdownMenuSeparator className="my-0.5" />
											)}
										</div>
									))}

									{filteredLabels.length === 0 && (
										<DropdownMenuItem disabled>
											{t("issues.new.noLabelsFound")}
										</DropdownMenuItem>
									)}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Selected labels */}
						{labels.length === 0 ? (
							<span className="px-2 text-xs text-muted-foreground">
								{t("issues.new.noLabels")}
							</span>
						) : (
							<div className="flex flex-wrap gap-1.5 px-2">
								{labels.map((label) => (
									<Badge
										key={label.id}
										variant="outline"
										className={`gap-1 px-2 py-0.5 text-xs ${
											labelStyles[label.text] ??
											"border-border bg-muted/30 text-foreground"
										}`}
									>
										{label.text}

										<button
											type="button"
											className="ml-0.5 rounded-sm opacity-60 transition-opacity hover:opacity-100"
											onClick={() => removeLabel(label.id)}
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
