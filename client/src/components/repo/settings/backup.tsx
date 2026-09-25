import { useParams } from "@tanstack/react-router";
import { CloudBackup } from "lucide-react";
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

function formatBytes(bytes: number): string {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function Backup() {
	const { username, repo } = useParams({ strict: false });
	const { data, isLoading } = useBackupStatus(username, repo);
	const toggle = useToggleBackup(username, repo);
	const run = useRunBackup(username, repo);

	const enabled = data?.enabled ?? false;
	const busy = toggle.isPending || run.isPending;

	async function handleToggle() {
		try {
			await toggle.mutateAsync(!enabled);
			toast.success(enabled ? "Backups disabled" : "Backups enabled");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	}

	async function handleRun() {
		try {
			await run.mutateAsync();
			toast.success("Backup created");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		}
	}

	return (
		<div className="max-w-3xl space-y-2">
			<h1 className="text-2xl">Backup</h1>
			<Separator className="my-2" />
			<p className="text-muted-foreground">
				Automatically back up this repository to protect your code and Git
				history. Only the newest snapshot is kept.
			</p>

			<Alert className="my-7 max-w-5xl border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100">
				<CloudBackup className="size-4" />

				<AlertTitle>
					{isLoading
						? "Repository backup"
						: enabled
							? "Backups enabled"
							: "Repository backup"}
				</AlertTitle>

				<AlertDescription>
					{isLoading ? (
						"Loading backup status..."
					) : enabled ? (
						data?.lastBackupAt ? (
							<>
								Last backup {new Date(data.lastBackupAt).toLocaleString()} (
								{data.commitHash.slice(0, 7)}, {formatBytes(data.size)}) —{" "}
								{data.isLatest ? "up to date." : "new commits available."}
							</>
						) : (
							"No backup created yet. Run the first backup to protect this repository."
						)
					) : (
						"Enable backups to protect your code and Git history."
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
									<span className="ml-2">Backing up...</span>
								</>
							) : (
								"Back up now"
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
								<span className="ml-2">Saving...</span>
							</>
						) : enabled ? (
							"Disable"
						) : (
							"Enable"
						)}
					</Button>
				</AlertAction>
			</Alert>
		</div>
	);
}

export default Backup;
