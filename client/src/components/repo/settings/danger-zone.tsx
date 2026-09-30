import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Spinner } from "#/components/ui/spinner";
import { useRepoData } from "#/hooks/useRepoData";

const DangerZone = () => {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { data } = useRepoData(username, repo);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [confirmName, setConfirmName] = useState("");
	const [busy, setBusy] = useState<"visibility" | "archive" | "delete" | null>(
		null,
	);

	const visibility = data?.visibility ?? false;
	const archived = data?.archived ?? false;
	const repoName = data?.name ?? repo;
	const statusLabel = t(
		archived
			? visibility
				? "repo.visibility.archivedAndPublic"
				: "repo.visibility.archivedAndPrivate"
			: visibility
				? "repo.visibility.public"
				: "repo.visibility.private",
	);

	async function toggleVisibility() {
		const next = !visibility;
		setBusy("visibility");

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/visibility`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ visibility: next }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.danger.updateVisibilityFailed"),
				);
			}

			toast.success(
				t("repo.settings.danger.visibilityUpdated", {
					visibility: next
						? t("repo.visibility.public")
						: t("repo.visibility.private"),
				}),
			);
			await queryClient.invalidateQueries({
				queryKey: ["repo", username, repo],
			});
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			);
		} finally {
			setBusy(null);
		}
	}

	async function toggleArchive() {
		const next = !archived;
		setBusy("archive");

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/archive`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ archived: next }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.danger.updateFailed"),
				);
			}

			toast.success(
				next
					? t("repo.settings.danger.archivedToast")
					: t("repo.settings.danger.unarchivedToast"),
			);
			await queryClient.invalidateQueries({
				queryKey: ["repo", username, repo],
			});
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			);
		} finally {
			setBusy(null);
		}
	}

	async function handleDelete() {
		setBusy("delete");

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.danger.deleteFailed"),
				);
			}

			toast.success(t("repo.settings.danger.deletedToast"));
			queryClient.removeQueries({ queryKey: ["repo", username, repo] });
			navigate({ to: "/" });
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			);
			setBusy(null);
		}
	}

	return (
		<div className="mt-10 mb-10">
			<h1 className="text-2xl text-destructive mb-2">
				{t("repo.settings.danger.title")}
			</h1>
			<div className="border border-destructive max-w-3xl rounded-sm">
				<div className="p-3 text-sm flex flex-row items-center justify-between border-b gap-4">
					<div className="flex flex-col">
						<span className="font-bold">
							{t("repo.settings.danger.changeVisibility")}
						</span>
						<span>
							{" "}
							{t("repo.settings.danger.currentVisibility", {
								status: statusLabel,
							})}
						</span>
					</div>
					<Button
						variant="destructive"
						onClick={toggleVisibility}
						disabled={busy !== null}
					>
						{busy === "visibility" ? (
							<Spinner />
						) : visibility ? (
							t("repo.settings.danger.makePrivate")
						) : (
							t("repo.settings.danger.makePublic")
						)}
					</Button>
				</div>

				<div className="p-3 text-sm flex flex-row items-center justify-between border-b gap-4">
					<div className="flex flex-col">
						<span className="font-bold">
							{t("repo.settings.danger.archive")}
						</span>
						<span>{t("repo.settings.danger.archiveDescription")}</span>
					</div>
					<Button
						variant="destructive"
						onClick={toggleArchive}
						disabled={busy !== null}
					>
						{busy === "archive" ? (
							<Spinner />
						) : archived ? (
							t("repo.settings.danger.unarchive")
						) : (
							t("repo.settings.danger.archive")
						)}
					</Button>
				</div>

				<div className="p-3 text-sm flex flex-row items-center justify-between gap-4">
					<div className="flex flex-col">
						<span className="font-bold">
							{t("repo.settings.danger.delete")}
						</span>
						<span> {t("repo.settings.danger.deleteWarning")}</span>
					</div>
					<Button
						variant="destructive"
						onClick={() => {
							setConfirmName("");
							setDeleteOpen(true);
						}}
						disabled={busy !== null}
					>
						{t("repo.settings.danger.delete")}
					</Button>
				</div>
			</div>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("repo.settings.danger.deleteTitle", { name: repoName })}
						</DialogTitle>
						<DialogDescription>
							{t("repo.settings.danger.deleteBody", { name: repoName })}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<Label htmlFor="confirm-repo-name">
							{t("repo.settings.danger.deleteConfirmHint", { name: repoName })}
						</Label>
						<Input
							id="confirm-repo-name"
							value={confirmName}
							onChange={(e) => setConfirmName(e.target.value)}
							placeholder={repoName}
							autoFocus
						/>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteOpen(false)}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={confirmName !== repoName || busy !== null}
							onClick={handleDelete}
						>
							{busy === "delete" ? (
								<Spinner />
							) : (
								t("repo.settings.danger.deleteConfirm")
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default DangerZone;
