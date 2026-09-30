import { useParams } from "@tanstack/react-router";
import { CloudBackup } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import {
	useBackupStatus,
	useRunBackup,
	useToggleBackup,
} from "#/hooks/useBackup";
import { formatBytes, formatDateTime } from "#/i18n/lib/format";

function Backup() {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });
	const { data, isLoading } = useBackupStatus(username, repo);
	const toggle = useToggleBackup(username, repo);
	const run = useRunBackup(username, repo);

	const enabled = data?.enabled ?? false;
	const busy = toggle.isPending || run.isPending;

	async function handleToggle() {
		try {
			await toggle.mutateAsync(!enabled);
			toast.success(
				enabled
					? t("repo.settings.backup.disabledToast")
					: t("repo.settings.backup.enabledToast"),
			);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			);
		}
	}

	async function handleRun() {
		try {
			await run.mutateAsync();
			toast.success(t("repo.settings.backup.createdToast"));
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			);
		}
	}

	return (
		<div className="max-w-3xl space-y-2">
			<h1 className="text-2xl">{t("repo.settings.backup.title")}</h1>
			<Separator className="my-2" />
			<p className="text-muted-foreground">
				{t("repo.settings.backup.description")}
			</p>

			<Alert className="my-7 max-w-5xl border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100">
				<CloudBackup className="size-4" />

				<AlertTitle>
					{isLoading
						? t("repo.settings.backup.alertTitle")
						: enabled
							? t("repo.settings.backup.alertEnabled")
							: t("repo.settings.backup.alertTitle")}
				</AlertTitle>

				<AlertDescription>
					{isLoading ? (
						t("repo.settings.backup.loading")
					) : enabled ? (
						data?.lastBackupAt ? (
							<>
								{t("repo.settings.backup.lastBackup", {
									date: formatDateTime(new Date(data.lastBackupAt)),
									hash: data.commitHash.slice(0, 7),
									size: formatBytes(data.size),
								})}
								{data.isLatest
									? t("repo.settings.backup.upToDate")
									: t("repo.settings.backup.newCommits")}
							</>
						) : (
							t("repo.settings.backup.noBackup")
						)
					) : (
						t("repo.settings.backup.enableHint")
					)}
				</AlertDescription>

				<AlertAction className="my-1 flex gap-2">
					{enabled && (
						<Button
							variant="outline"
							onClick={handleRun}
							disabled={busy || isLoading}
						>
							{run.isPending ? (
								<>
									<Spinner />
									<span className="ml-2">
										{t("repo.settings.backup.backingUp")}
									</span>
								</>
							) : (
								t("repo.settings.backup.backupNow")
							)}
						</Button>
					)}
					<Button
						variant={enabled ? "outline" : "default"}
						onClick={handleToggle}
						disabled={busy || isLoading}
					>
						{toggle.isPending ? (
							<>
								<Spinner />
								<span className="ml-2">{t("common.actions.saving")}</span>
							</>
						) : enabled ? (
							t("repo.settings.backup.disable")
						) : (
							t("repo.settings.backup.enable")
						)}
					</Button>
				</AlertAction>
			</Alert>
		</div>
	);
}

export default Backup;
