import { i18n } from "#/i18n/i18n"
import { useTranslation } from "react-i18next"
import { apiErrorMessage } from "#/i18n/lib/api-error"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field"
import { Input } from "#/components/ui/input"
import { Separator } from "#/components/ui/separator"
import { Button } from "#/components/ui/button"
import { Spinner } from "#/components/ui/spinner"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import { authClient } from "#/lib/auth-client"

const API_BASE = "http://localhost:3200"

function ContentAccount() {
	const { t } = useTranslation()

	const { refetch } = authClient.useSession()

	// --- Email ---
	const [email, setEmail] = useState("")
	const [originalEmail, setOriginalEmail] = useState("")
	const [loadingEmail, setLoadingEmail] = useState(true)
	const [updatingEmail, setUpdatingEmail] = useState(false)

	// --- Password ---
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [changingPassword, setChangingPassword] = useState(false)

	// --- Delete Account ---
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [deletePassword, setDeletePassword] = useState("")
	const [deleting, setDeleting] = useState(false)

	// Fetch current account data on mount
	useEffect(() => {
		let cancelled = false

		async function fetchAccount() {
			try {
				const res = await fetch(`${API_BASE}/api/user/account`, {
					credentials: "include",
				})

				if (!res.ok) {
					throw new Error(
						apiErrorMessage(null, { fallbackKey: "errors.client.fetchAccount" }),
					)
				}

				const data = await res.json()

				if (!cancelled) {
					setEmail(data.email)
					setOriginalEmail(data.email)
				}
			} catch {
				if (!cancelled) {
					toast.error(i18n.t("auth.account.loadFailed"))
				}
			} finally {
				if (!cancelled) {
					setLoadingEmail(false)
				}
			}
		}

		fetchAccount()
		return () => {
			cancelled = true
		}
	}, [])

	const emailChanged = email.trim() !== originalEmail && email.trim() !== ""

	// --- Update Email ---
	async function handleUpdateEmail() {
		if (!email.trim()) {
			toast.error(t("auth.account.emailRequired"))
			return
		}

		setUpdatingEmail(true)

		try {
			const res = await fetch(`${API_BASE}/api/user/account`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email: email.trim() }),
			})

			const result = await res.json()

			if (!res.ok) {
				throw new Error(apiErrorMessage(result))
			}

			setOriginalEmail(email.trim())
			await refetch()
			toast.success(t("auth.account.emailUpdated"))
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			)
		} finally {
			setUpdatingEmail(false)
		}
	}

	// --- Change Password ---
	async function handleChangePassword() {
		if (!currentPassword) {
			toast.error(t("auth.account.enterCurrentPassword"))
			return
		}

		if (!newPassword) {
			toast.error(t("auth.account.enterNewPassword"))
			return
		}

		if (newPassword.length < 8) {
			toast.error(t("auth.account.newPasswordTooShort"))
			return
		}

		if (newPassword !== confirmPassword) {
			toast.error(t("auth.account.passwordsDoNotMatch"))
			return
		}

		setChangingPassword(true)

		try {
			const res = await fetch(`${API_BASE}/api/user/account/password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
			})

			const result = await res.json()

			if (!res.ok) {
				throw new Error(apiErrorMessage(result))
			}

			setCurrentPassword("")
			setNewPassword("")
			setConfirmPassword("")
			toast.success(t("auth.account.passwordChanged"))
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			)
		} finally {
			setChangingPassword(false)
		}
	}

	// --- Delete Account ---
	async function handleDeleteAccount() {
		if (!deletePassword) {
			toast.error(t("auth.account.enterPassword"))
			return
		}

		setDeleting(true)

		try {
			const res = await fetch(`${API_BASE}/api/user/account`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ password: deletePassword }),
			})

			const result = await res.json()

			if (!res.ok) {
				throw new Error(
					apiErrorMessage(result),
				)
			}

			toast.success(t("auth.account.deleted"))
			window.location.href = "/"
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("common.errors.somethingWentWrong"),
			)
		} finally {
			setDeleting(false)
		}
	}

	if (loadingEmail) {
		return (
			<div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
				<div className="pt-4">
					<h1 className="text-xl">{t("auth.account.title")}</h1>
					<Separator className="my-2" />
				</div>
				<div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
					<Spinner />
					<span>{t("auth.account.loading")}</span>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
			<div className="pt-4">
				<h1 className="text-xl">{t("auth.account.passwordHeading")}</h1>
				<Separator className="my-2" />
			</div>

			<FieldGroup className="w-120">
				<Field>
					<FieldLabel htmlFor="current-password">
						{t("auth.account.currentPassword")}
					</FieldLabel>

					<Input
						id="current-password"
						type="password"
						placeholder={t("auth.account.currentPasswordPlaceholder")}
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						disabled={changingPassword}
						className="mb-3"
					/>

					<FieldLabel htmlFor="new-password">
						{t("auth.account.newPassword")}
					</FieldLabel>

					<Input
						id="new-password"
						type="password"
						placeholder={t("auth.account.newPasswordPlaceholder")}
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						disabled={changingPassword}
						className="mb-3"
					/>

					<FieldLabel htmlFor="confirm-password">
						{t("auth.account.confirmNewPassword")}
					</FieldLabel>

					<Input
						id="confirm-password"
						type="password"
						placeholder={t("auth.account.confirmNewPasswordPlaceholder")}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						disabled={changingPassword}
					/>
				</Field>

				<div>
					<Button
						onClick={handleChangePassword}
						disabled={
							changingPassword ||
							!currentPassword ||
							!newPassword ||
							!confirmPassword
						}
					>
						{changingPassword ? (
							<>
								<Spinner />
								<span className="ml-2">{t("auth.account.changing")}</span>
							</>
						) : t("auth.account.changePassword")}
					</Button>
				</div>
			</FieldGroup>

			<div className="pt-4">
				<h1 className="text-xl">{t("auth.account.emailHeading")}</h1>
				<Separator className="my-2" />
			</div>

			<FieldGroup className="w-120">
				<Field>
					<FieldLabel htmlFor="email">
						{t("auth.account.emailLabel")}
					</FieldLabel>

					<Input
						id="email"
						type="email"
						placeholder="name@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={updatingEmail}
					/>

					<FieldDescription>
						{t("auth.account.emailDescription")}
					</FieldDescription>
				</Field>

				<div>
					<Button
						onClick={handleUpdateEmail}
						disabled={updatingEmail || !emailChanged}
					>
						{updatingEmail ? (
							<>
								<Spinner />
								<span className="ml-2">{t("auth.account.updating")}</span>
							</>
						) : t("auth.account.updateEmail")}
					</Button>
				</div>
			</FieldGroup>

			<div className="pt-8">
				<h1 className="mb-2 text-2xl text-destructive">
					{t("auth.account.dangerHeading")}
				</h1>

				<div className="max-w-full rounded-sm border border-destructive">
					<div className="flex flex-row items-center justify-between gap-4 p-4">
						<div className="flex flex-col">
							<span className="font-bold">
								{t("auth.account.deleteLabel")}
							</span>

							<span className="text-sm">
								{t("auth.account.deleteHelp")}
							</span>
						</div>

						<Button
							variant="destructive"
							onClick={() => {
								setDeletePassword("")
								setDeleteOpen(true)
							}}
						>
							{t("auth.account.deleteButton")}
						</Button>
					</div>
				</div>
			</div>

			<Dialog
				open={deleteOpen}
				onOpenChange={(open) => {
					if (!deleting) {
						setDeleteOpen(open)
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("auth.account.deleteDialogTitle")}
						</DialogTitle>

						<DialogDescription>
							{t("auth.account.deleteDialogDescription")}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<FieldLabel htmlFor="delete-password">
							{t("auth.account.confirmPasswordLabel")}
						</FieldLabel>

						<Input
							id="delete-password"
							type="password"
							value={deletePassword}
							onChange={(event) =>
								setDeletePassword(event.target.value)
							}
							placeholder={t("auth.account.confirmPasswordPlaceholder")}
							autoFocus
							disabled={deleting}
						/>

						<p className="text-sm text-muted-foreground">
							{t("auth.account.confirmPasswordHelp")}
						</p>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteOpen(false)}
							disabled={deleting}
						>
							{t("common.actions.cancel")}
						</Button>

						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={!deletePassword || deleting}
						>
							{deleting ? (
								<>
									<Spinner />
									<span className="ml-2">
										{t("auth.account.deleting")}
									</span>
								</>
							) : t("auth.account.deleteConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default ContentAccount
