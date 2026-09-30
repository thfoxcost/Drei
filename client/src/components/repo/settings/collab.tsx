import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Contributor } from "#/components/repo/contributor-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "#/components/ui/combobox";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { useRepoData } from "#/hooks/useRepoData";
import { authClient } from "#/lib/auth-client";

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

function Collab() {
	const { t } = useTranslation();
	const { username, repo } = useParams({ strict: false });
	const queryClient = useQueryClient();
	const { data, isLoading } = useRepoData(username, repo);
	const { data: session } = authClient.useSession();

	const [selected, setSelected] = useState<Contributor | null>(null);
	const [busy, setBusy] = useState<string | null>(null);

	const { data: candidates, isLoading: candidatesLoading } = useQuery({
		queryKey: ["collaborator-candidates", username, repo],
		queryFn: async (): Promise<Contributor[]> => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/collaborators`,
			);
			if (!res.ok) throw new Error(t("repo.settings.collab.fetchFailed"));
			const result = await res.json();
			return result.users ?? [];
		},
		staleTime: 60_000,
	});

	const contributors = data?.contributors ?? [];
	const isAdmin = Boolean(
		session?.user.id && data?.ownerId && session.user.id === data.ownerId,
	);
	const available = candidates ?? [];

	async function refresh() {
		await queryClient.invalidateQueries({ queryKey: ["repo", username, repo] });
		await queryClient.invalidateQueries({
			queryKey: ["collaborator-candidates", username, repo],
		});
	}

	async function handleAdd(user: Contributor) {
		if (busy) return;
		setBusy("add");

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/collaborators`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: user.id,
						username: user.username,
						avatar: user.avatar,
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || t("repo.settings.collab.addFailed"),
				);
			}

			toast.success(
				t("repo.settings.collab.addedToast", { username: user.username }),
			);
			setSelected(null);
			await refresh();
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

	async function handleRemove(contributor: Contributor) {
		if (busy) return;
		setBusy(contributor.username);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/collaborators`,
				{
					method: "DELETE",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username: contributor.username }),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error ||
						result.message ||
						t("repo.settings.collab.removeFailed"),
				);
			}

			toast.success(
				t("repo.settings.collab.removedToast", {
					username: contributor.username,
				}),
			);
			await refresh();
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

	return (
		<div className="max-w-3xl">
			<h1 className="text-2xl">{t("repo.settings.collab.title")}</h1>
			<Separator className="my-2" />

			<h1 className="mb-1 mt-3 text-md font-bold">
				{t("repo.settings.collab.collaborators")}
			</h1>

			{isLoading ? (
				<div className="flex items-center gap-2 p-3 text-muted-foreground">
					<Spinner />
					<span className="text-sm">{t("repo.settings.collab.loading")}</span>
				</div>
			) : contributors.length === 0 ? (
				<p className="border rounded-md bg-muted/20 p-3 text-sm text-muted-foreground">
					{t("repo.settings.collab.empty")}
				</p>
			) : (
				<div className="border mb-3 rounded-md bg-muted/20">
					<ul className="divide-y divide-border">
						{contributors.map((contributor) => {
							const isOwner =
								contributor.username.toLowerCase() ===
								data?.owner.toLowerCase();

							return (
								<li
									key={contributor.id || contributor.username}
									className="flex items-center gap-3 px-3 py-2.5"
								>
									<Avatar className="size-9">
										{contributor.avatar ? (
											<AvatarImage
												src={contributor.avatar}
												alt={contributor.username}
											/>
										) : null}
										<AvatarFallback className="text-xs">
											{getInitials(contributor.username)}
										</AvatarFallback>
									</Avatar>

									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate font-semibold">
												{contributor.username}
											</span>
											{isOwner ? (
												<Badge>{t("repo.settings.collab.admin")}</Badge>
											) : (
												<Badge variant="secondary">
													{t("repo.settings.collab.collaborator")}
												</Badge>
											)}
										</div>
										<p className="truncate text-xs text-muted-foreground">
											@{contributor.username}
										</p>
									</div>

									{isAdmin && !isOwner && (
										<Button
											variant="ghost"
											size="icon"
											aria-label={t("repo.settings.collab.remove", {
												username: contributor.username,
											})}
											disabled={busy !== null}
											onClick={() => handleRemove(contributor)}
										>
											{busy === contributor.username ? (
												<Spinner className="size-4" />
											) : (
												<X />
											)}
										</Button>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			)}

			{isAdmin && (
				<>
					<h1 className="mb-1 mt-3 text-md font-bold">
						{t("repo.settings.collab.addHeading")}
					</h1>
					{candidatesLoading ? (
						<div className="flex items-center gap-2 p-3 text-muted-foreground">
							<Spinner />
							<span className="text-sm">
								{t("repo.settings.collab.loadingUsers")}
							</span>
						</div>
					) : available.length === 0 ? (
						<p className="border rounded-md bg-muted/20 p-3 text-sm text-muted-foreground">
							{t("repo.settings.collab.noUsers")}
						</p>
					) : (
						<Combobox
							items={available}
							itemToStringLabel={(user) => user.username}
							value={selected}
							onValueChange={(value) => {
								if (value) {
									setSelected(value);
									void handleAdd(value);
								}
							}}
							disabled={busy !== null}
						>
							<ComboboxInput
								className="w-full"
								placeholder={t("repo.settings.collab.searchPlaceholder")}
								disabled={busy !== null}
							/>
							<ComboboxContent>
								<ComboboxEmpty>
									{t("repo.settings.collab.noUsersFound")}
								</ComboboxEmpty>
								<ComboboxList>
									{(user) => (
										<ComboboxItem key={user.id || user.username} value={user}>
											<Avatar className="size-6">
												{user.avatar ? (
													<AvatarImage src={user.avatar} alt={user.username} />
												) : null}
												<AvatarFallback className="text-[10px]">
													{getInitials(user.username)}
												</AvatarFallback>
											</Avatar>
											<span className="truncate">{user.username}</span>
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					)}
				</>
			)}
		</div>
	);
}

export default Collab;
