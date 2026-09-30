import { useNavigate } from "@tanstack/react-router";
import { Check, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UserAvatar } from "#/components/UserAvatar";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
} from "#/components/ui/dropdown-menu";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Textarea } from "#/components/ui/textarea";
import { useRepoData } from "#/hooks/useRepoData";
import useUserRepos from "#/hooks/useUserRepos";
import { authClient } from "#/lib/auth-client";

interface ForkProp {
	owner: string;
	reponame: string;
}

type ValidationState = "available" | "taken" | null;

function useRepoNameValidation(name: string): {
	state: ValidationState;
	checking: boolean;
} {
	const { repos } = useUserRepos();
	const [state, setState] = useState<ValidationState>(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		if (!name.trim()) {
			setState(null);
			setChecking(false);
			return;
		}

		setChecking(true);

		const timer = setTimeout(() => {
			const taken = repos.some(
				(r) => r.name.toLowerCase() === name.trim().toLowerCase(),
			);

			setState(taken ? "taken" : "available");
			setChecking(false);
		}, 400);

		return () => clearTimeout(timer);
	}, [name, repos]);

	return { state, checking };
}

function Fork({ owner, reponame }: ForkProp) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const { data: upstreamRepo } = useRepoData(owner, reponame);

	const [name, setName] = useState(reponame);
	const [description, setDescription] = useState("");
	const [copyMainOnly, setCopyMainOnly] = useState(true);
	const [creating, setCreating] = useState(false);

	const descriptionEdited = useRef(false);

	useEffect(() => {
		if (upstreamRepo?.description && !descriptionEdited.current) {
			setDescription(upstreamRepo.description);
		}
	}, [upstreamRepo?.description]);

	const { state: validation } = useRepoNameValidation(name);

	const inputClasses =
		validation === "available"
			? "border-green-500 text-green-600 focus-visible:ring-green-500 pr-10"
			: validation === "taken"
				? "border-red-500 text-red-600 focus-visible:ring-red-500 pr-10"
				: "";

	function handleBack() {
		navigate({
			to: "/$username/$repo",
			params: { username: owner, repo: reponame },
		});
	}

	async function handleCreateFork() {
		setCreating(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${reponame}/fork`,
				{
					method: "POST",
					credentials: "include",
				},
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || t("repo.fork.failed"));
			}

			toast.success(data.message || t("repo.fork.success"));

			navigate({
				to: "/$username/$repo",
				params: {
					username: data.owner,
					repo: data.name,
				},
			});
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error(t("repo.fork.error"));
			}
		} finally {
			setCreating(false);
		}
	}

	return (
		<div>
			<h1 className="text-2xl font-medium">{t("repo.fork.createHeading")}</h1>

			<span className="text-sm text-muted-foreground">
				{t("repo.fork.createIntro")}
			</span>

			<Separator className="my-2" />

			<div className="mt-4 max-w-xl">
				<div className="flex items-end gap-2">
					{/* Owner */}
					<div className="shrink-0">
						<FieldLabel className="mb-2 block">
							{t("repo.fork.ownerLabel")}
						</FieldLabel>

						<DropdownMenu>
							<Button variant="outline">
								<UserAvatar
									src={session?.user.image}
									name={session?.user.name}
									className="size-5.5"
								/>

								<span className="text-xs">
									@{session?.user.name ?? t("common.states.unknownUser")}
								</span>
							</Button>

							<DropdownMenuContent className="w-auto">
								<p className="p-2 text-sm text-muted-foreground">
									{t("repo.fork.orgSelectorSoon")}
								</p>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Repository name */}
					<Field className="flex-1">
						<FieldLabel className="block">
							{t("repo.fork.nameLabel")}
						</FieldLabel>

						<div className="relative">
							<Input
								value={name}
								id="repo-name"
								name="name"
								placeholder={t("repo.fork.namePlaceholder")}
								required
								className={inputClasses}
								onChange={(e) => setName(e.target.value)}
							/>

							{validation === "available" && (
								<Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-green-600" />
							)}

							{validation === "taken" && (
								<X className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-red-600" />
							)}
						</div>
					</Field>
				</div>
			</div>

			<p className="mt-2 text-sm text-muted-foreground">
				{t("repo.fork.nameHelp")}
			</p>

			{/* Description */}
			<Field className="mt-4">
				<FieldLabel htmlFor="description">
					{t("repo.fork.descriptionLabel")}
				</FieldLabel>

				<Textarea
					id="description"
					name="description"
					rows={3}
					maxLength={350}
					placeholder={t("repo.fork.descriptionPlaceholder")}
					value={description}
					onChange={(e) => {
						descriptionEdited.current = true;
						setDescription(e.target.value);
					}}
				/>

				<FieldDescription>{t("repo.fork.descriptionHelp")}</FieldDescription>
			</Field>

			<Separator className="my-4" />

			<div className="mt-6 space-y-4">
				<Field className="flex items-start gap-3" orientation="horizontal">
					<Checkbox
						id="copy-main-only"
						checked={copyMainOnly}
						onCheckedChange={(checked) => setCopyMainOnly(checked === true)}
						disabled
					/>

					<FieldContent>
						<FieldLabel htmlFor="copy-main-only">
							{t("repo.fork.copyMainLabel")}
						</FieldLabel>

						<FieldDescription>{t("repo.fork.copyMainHelp")}</FieldDescription>
					</FieldContent>
				</Field>
			</div>

			<Separator className="my-4" />

			<span className="flex items-center gap-2 text-sm text-muted-foreground">
				<Info size={18} />
				{t("repo.fork.personalNote")}
			</span>

			<div className="mt-2 flex justify-end gap-2">
				<Button variant="outline" onClick={handleBack}>
					{t("common.actions.back")}
				</Button>
				<Button
					onClick={handleCreateFork}
					disabled={creating || validation === "taken" || !name.trim()}
				>
					{creating ? t("repo.fork.creating") : t("repo.fork.create")}
				</Button>
			</div>
		</div>
	);
}

export default Fork;
