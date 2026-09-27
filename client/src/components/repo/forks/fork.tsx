import { useNavigate } from "@tanstack/react-router";
import { Check, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/reui/badge";
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
				`/api/repos/${owner}/${reponame}/fork`,
				{
					method: "POST",
					credentials: "include",
				},
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to fork repository");
			}

			toast.success(data.message || "Repository forked successfully");

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
				toast.error("Something went wrong while forking");
			}
		} finally {
			setCreating(false);
		}
	}

	return (
		<div>
			<h1 className="text-2xl font-medium">Create a new fork</h1>

			<span className="text-sm text-muted-foreground">
				A fork is a copy of a repository. Forking a repository allows you to
				freely experiment with changes without affecting the original project.
			</span>

			<Separator className="my-2" />

			<div className="mt-4 max-w-xl">
				<div className="flex items-end gap-2">
					{/* Owner */}
					<div className="shrink-0">
						<FieldLabel className="mb-2 block">Owner*</FieldLabel>

						<DropdownMenu>
							<Button variant="outline">
								<UserAvatar
									src={session?.user.image}
									name={session?.user.name}
									className="size-5.5"
								/>

								<span className="text-xs">
									@{session?.user.name ?? "Unknown User"}
								</span>
							</Button>

							<DropdownMenuContent className="w-auto">
								<p className="p-2 text-sm text-muted-foreground">
									Organization selector coming soon.
								</p>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Repository name */}
					<Field className="flex-1">
						<FieldLabel className="block">Repository name*</FieldLabel>

						<div className="relative">
							<Input
								value={name}
								id="repo-name"
								name="name"
								placeholder="awesome-project"
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
				By default, forks are named the same as their upstream repository. You
				can customize the name to distinguish it further.
			</p>

			{/* Description */}
			<Field className="mt-4">
				<FieldLabel htmlFor="description">Description</FieldLabel>

				<Textarea
					id="description"
					name="description"
					rows={3}
					maxLength={350}
					placeholder="Tell people what your repository is about..."
					value={description}
					onChange={(e) => {
						descriptionEdited.current = true;
						setDescription(e.target.value);
					}}
				/>

				<FieldDescription>
					Briefly describe your repository (optional, max 350 characters).
				</FieldDescription>
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
							Copy the <Badge variant="outline">main</Badge> branch only
						</FieldLabel>

						<FieldDescription>
							Only copy the <span className="font-medium">main</span> branch
							instead of all branches.
						</FieldDescription>
					</FieldContent>
				</Field>
			</div>

			<Separator className="my-4" />

			<span className="flex items-center gap-2 text-sm text-muted-foreground">
				<Info size={18} />
				You are creating a fork in your personal account.
			</span>

			<div className="mt-2 flex justify-end gap-2">
				<Button variant="outline" onClick={handleBack}>
					Back
				</Button>
				<Button
					onClick={handleCreateFork}
					disabled={creating || validation === "taken" || !name.trim()}
				>
					{creating ? "Creating..." : "Create fork"}
				</Button>
			</div>
		</div>
	);
}

export default Fork;
