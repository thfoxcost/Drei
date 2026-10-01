import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Switch } from "#/components/ui/switch";

const httpUnauthorized = 401;
const httpForbidden = 403;

type DiscordConfig = {
	configured: boolean;
	pr_notifications: boolean;
	issue_notifications: boolean;
	masked_url: string | null;
	updated_at: string | null;
};

function Webhooks() {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });

	const [loading, setLoading] = useState(true);
	const [forbidden, setForbidden] = useState(false);
	const [configured, setConfigured] = useState(false);
	const [maskedUrl, setMaskedUrl] = useState<string | null>(null);
	const [url, setUrl] = useState("");
	const [prNotifications, setPrNotifications] = useState(false);
	const [issueNotifications, setIssueNotifications] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		async function fetchConfig() {
			try {
				const res = await fetch(
					`http://localhost:3200/api/repos/${username}/${repo}/discord`,
					{ credentials: "include" },
				);

				if (res.status === httpUnauthorized || res.status === httpForbidden) {
					setForbidden(true);
					return;
				}

				if (!res.ok) {
					throw new Error(t("repo.settings.webhooks.loadFailed"));
				}

				const data: DiscordConfig = await res.json();
				setConfigured(data.configured);
				setMaskedUrl(data.masked_url);
				setPrNotifications(data.pr_notifications);
				setIssueNotifications(data.issue_notifications);
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: t("repo.settings.webhooks.loadFailed"),
				);
			} finally {
				setLoading(false);
			}
		}

		fetchConfig();
	}, [username, repo, t]);

	async function handleSave() {
		if (saving) return;
		setSaving(true);

		try {
			const body: Record<string, unknown> = {
				pr_notifications: prNotifications,
				issue_notifications: issueNotifications,
			};

			if (url.trim() !== "") {
				body.url = url.trim();
			}

			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/discord`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.webhooks.saveFailed"),
				);
			}

			const data: DiscordConfig = result;
			setConfigured(data.configured);
			setMaskedUrl(data.masked_url);
			setPrNotifications(data.pr_notifications);
			setIssueNotifications(data.issue_notifications);
			setUrl("");
			toast.success(t("repo.settings.webhooks.saved"));
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("repo.settings.webhooks.saveFailed"),
			);
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (deleting) return;
		setDeleting(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/discord`,
				{ method: "DELETE", credentials: "include" },
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.webhooks.deleteFailed"),
				);
			}

			setConfigured(false);
			setMaskedUrl(null);
			setPrNotifications(false);
			setIssueNotifications(false);
			setUrl("");
			toast.success(t("repo.settings.webhooks.deleted"));
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("repo.settings.webhooks.deleteFailed"),
			);
		} finally {
			setDeleting(false);
		}
	}

	if (loading) {
		return (
			<div className="mt-8">
				<h1 className="text-2xl">{t("repo.settings.webhooks.title")}</h1>
				<Separator className="my-2" />
				<div className="flex items-center gap-2 py-4 text-muted-foreground">
					<Spinner />
					<span className="text-sm">{t("repo.settings.webhooks.loading")}</span>
				</div>
			</div>
		);
	}

	if (forbidden) {
		return (
			<div className="mt-8">
				<h1 className="text-2xl">{t("repo.settings.webhooks.title")}</h1>
				<Separator className="my-2" />
				<p className="border rounded-md bg-muted/20 p-3 text-sm text-muted-foreground">
					{t("repo.settings.webhooks.forbidden")}
				</p>
			</div>
		);
	}

	return (
		<div className="mt-8">
			<h1 className="text-2xl">{t("repo.settings.webhooks.title")}</h1>
			<Separator className="my-2" />
			<p className="text-sm text-muted-foreground">
				{t("repo.settings.webhooks.description")}
			</p>

			<div className="mt-4 space-y-2">
				<Label htmlFor="discord-webhook-url">
					{t("repo.settings.webhooks.urlLabel")}
				</Label>
				<Input
					id="discord-webhook-url"
					type="url"
					placeholder={t("repo.settings.webhooks.urlPlaceholder")}
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					disabled={saving || deleting}
				/>
				<p className="text-sm text-muted-foreground">
					{configured && maskedUrl
						? t("repo.settings.webhooks.configuredAs", { masked: maskedUrl })
						: t("repo.settings.webhooks.notConfigured")}
				</p>
			</div>

			<div className="mt-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium">
						{t("repo.settings.webhooks.prLabel")}
					</p>
					<p className="text-sm text-muted-foreground">
						{t("repo.settings.webhooks.prHelp")}
					</p>
				</div>
				<Switch
					checked={prNotifications}
					onCheckedChange={setPrNotifications}
					disabled={saving || deleting}
					aria-label={t("repo.settings.webhooks.prLabel")}
				/>
			</div>

			<div className="mt-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium">
						{t("repo.settings.webhooks.issueLabel")}
					</p>
					<p className="text-sm text-muted-foreground">
						{t("repo.settings.webhooks.issueHelp")}
					</p>
				</div>
				<Switch
					checked={issueNotifications}
					onCheckedChange={setIssueNotifications}
					disabled={saving || deleting}
					aria-label={t("repo.settings.webhooks.issueLabel")}
				/>
			</div>

			<div className="mt-4 flex justify-end gap-2">
				{configured && (
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={saving || deleting}
					>
						{deleting ? (
							<>
								<Spinner />
								<span className="ml-2">
									{t("repo.settings.webhooks.deleting")}
								</span>
							</>
						) : (
							t("repo.settings.webhooks.delete")
						)}
					</Button>
				)}
				<Button onClick={handleSave} disabled={saving || deleting}>
					{saving ? (
						<>
							<Spinner />
							<span className="ml-2">{t("repo.settings.webhooks.saving")}</span>
						</>
					) : (
						t("repo.settings.webhooks.save")
					)}
				</Button>
			</div>
		</div>
	);
}

export default Webhooks;
