import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronDown, GitBranch, Image } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { FileUploadCompact } from "#/components/ui/file-upload-compact";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { useFileUpload } from "#/hooks/use-file-upload";
import { useRepoData } from "#/hooks/useRepoData";
import DangerZone from "./danger-zone";
import Webhooks from "./webhooks";

function General() {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { data, isLoading } = useRepoData(username, repo);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [website, setWebsite] = useState("");
	const [defaultBranch, setDefaultBranch] = useState("");
	const [renameValue, setRenameValue] = useState("");
	const [updating, setUpdating] = useState(false);

	const branches = data?.branches ?? [];

	const {
		uploading: uploadingLogo,
		error: logoError,
		handleSelect,
	} = useFileUpload({
		acceptedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
		maxSize: 2 * 1024 * 1024,
		onFile: uploadLogo,
	});

	async function uploadLogo(file: File) {
		const formData = new FormData();
		formData.append("logo", file);

		const res = await fetch(
			`http://localhost:3200/api/repos/${username}/${repo}/logo`,
			{ method: "POST", credentials: "include", body: formData },
		);

		const result = await res.json();

		if (!res.ok) {
			throw new Error(
				result.error ||
					result.message ||
					t("repo.settings.general.logoUploadFailed"),
			);
		}

		toast.success(t("repo.settings.general.logoUpdated"));
		await queryClient.invalidateQueries({ queryKey: ["repo", username, repo] });
	}

	useEffect(() => {
		if (data) {
			setName(data.name);
			setDescription(data.description);
			setWebsite(data.website);
			setDefaultBranch(data.defaultBranch);
			setRenameValue(data.defaultBranch);
		}
	}, [data]);

	const changed =
		!isLoading &&
		(name !== data?.name ||
			description !== data?.description ||
			website !== data?.website ||
			defaultBranch !== data?.defaultBranch ||
			renameValue !== data?.defaultBranch);

	const canSave = changed && name.trim() !== "" && !updating;

	async function handleUpdate() {
		setUpdating(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}`,
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: name.trim(),
						description,
						website,
						defaultBranch,
						renameDefaultBranch: renameValue.trim(),
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.general.infoUpdateFailed"),
				);
			}

			toast.success(t("repo.settings.general.infoUpdated"));

			await queryClient.invalidateQueries({
				queryKey: ["repo", username, repo],
			});

			if (name.trim() !== repo) {
				navigate({
					to: "/$username/$repo/settings",
					params: { username, repo: name.trim() },
				});
			}
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error(t("common.errors.somethingWentWrong"));
			}
		} finally {
			setUpdating(false);
		}
	}

	return (
		<div className="max-w-3xl space-y-2">
			<h1 className="text-2xl">{t("repo.settings.nav.general")}</h1>
			<Separator className="my-2" />

			<div className="space-y-2">
				<Label htmlFor="repo-name">
					{t("repo.settings.general.nameLabel")}
				</Label>
				<Input
					className="max-w-xs"
					id="repo-name"
					type="text"
					maxLength={30}
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={updating}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="repo-description">
					{t("repo.settings.general.descriptionLabel")}
				</Label>
				<Textarea
					id="repo-description"
					rows={3}
					maxLength={350}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					disabled={updating}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="repo-website">
					{t("repo.settings.general.websiteLabel")}
				</Label>
				<Input
					id="repo-website"
					type="url"
					className="max-w-md"
					placeholder="https://example.com"
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
					disabled={updating}
				/>
			</div>

			<div className="mt-8">
				<h1 className="text-2xl">{t("repo.settings.general.logo")}</h1>
				<Separator className="my-2" />
				<div className="flex items-center gap-4">
					{data?.logo ? (
						<img
							src={data.logo}
							alt={t("repo.settings.general.logoAlt", { name: data.name })}
							className="size-16 rounded-lg border border-border object-cover"
						/>
					) : (
						<div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-input text-muted-foreground">
							<Image className="size-6" />
						</div>
					)}

					<FileUploadCompact
						hint={t("repo.settings.general.logoHint")}
						uploading={uploadingLogo}
						error={logoError}
						onSelect={handleSelect}
					/>
				</div>
			</div>
			<div className="mt-8">
				<h1 className="text-2xl">{t("repo.settings.general.defaultBranch")}</h1>
				<Separator className="my-2" />
				<p className="text-muted-foreground">
					{t("repo.settings.general.defaultBranchDescription")}
				</p>
			</div>
			<div className="flex flex-wrap items-end gap-4 pt-2">
				<div className="space-y-2">
					<Label>{t("repo.settings.general.defaultBranch")}</Label>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="w-40 justify-between"
								disabled={updating || !data}
							>
								<span>{isLoading ? "..." : defaultBranch}</span>
								<ChevronDown className="size-4 opacity-60" />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="start" className="w-48">
							{branches.length === 0 ? (
								<DropdownMenuItem disabled>
									{t("repo.settings.general.noBranches")}
								</DropdownMenuItem>
							) : (
								branches.map((branch) => (
									<DropdownMenuItem
										key={branch}
										className="justify-between"
										onClick={() => setDefaultBranch(branch)}
									>
										<span className="flex items-center gap-2">
											<GitBranch className="size-4 text-muted-foreground" />
											{branch}
										</span>
										{branch === defaultBranch && (
											<Check className="size-4 text-primary" />
										)}
									</DropdownMenuItem>
								))
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="space-y-2">
					<Label htmlFor="rename-default-branch">
						{t("repo.settings.general.rename")}
					</Label>
					<Input
						id="rename-default-branch"
						className="max-w-xs"
						value={renameValue}
						onChange={(e) => setRenameValue(e.target.value)}
						disabled={updating || !data}
					/>
				</div>
			</div>

			<div className="flex justify-end pt-2 gap-2">
				<a href="/">
					<Button variant="outline">{t("common.actions.back")}</Button>
				</a>
				<Button onClick={handleUpdate} disabled={!canSave}>
					{updating ? (
						<>
							<Spinner />
							<span className="ml-2">
								{t("repo.settings.general.updating")}
							</span>
						</>
					) : (
						t("repo.settings.general.update")
					)}
				</Button>
			</div>
			<Webhooks />
			<DangerZone />
		</div>
	);
}

export default General;
